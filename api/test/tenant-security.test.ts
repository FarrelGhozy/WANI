import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockCustomerFindFirst = mock(
  (_args: any): Promise<any> => Promise.resolve(null)
);
const mockConversationFindFirst = mock(
  (_args: any): Promise<any> => Promise.resolve(null)
);
const mockMessageFindMany = mock(
  (_args: any): Promise<any[]> => Promise.resolve([])
);
const mockUsageFindUnique = mock(
  (_args: any): Promise<any> => Promise.resolve(null)
);

mock.module("@/config/db", () => ({
  prisma: {
    customer: { findFirst: mockCustomerFindFirst },
    conversation: { findFirst: mockConversationFindFirst },
    message: { findMany: mockMessageFindMany },
    usageCounter: { findUnique: mockUsageFindUnique },
  } as any,
}));

import { CustomerModel } from "@/models/customer";
import { ConversationModel } from "@/models/conversation";
import { MessageModel } from "@/models/message";
import { ActivityLogModel } from "@/models/activity-log";

describe("tenant data isolation", () => {
  beforeEach(() => {
    mockCustomerFindFirst.mockClear();
    mockConversationFindFirst.mockClear();
    mockMessageFindMany.mockClear();
    mockUsageFindUnique.mockClear();
  });

  test("customer lookup includes ownerId", async () => {
    await CustomerModel.getByIdWithDetail("owner-a", "customer-1");

    expect(mockCustomerFindFirst).toHaveBeenCalledWith({
      where: { id: "customer-1", ownerId: "owner-a" },
    });
  });

  test("conversation lookup rejects IDs outside the owner scope", async () => {
    await expect(
      ConversationModel.getOwnedOrThrow("owner-a", "conversation-1")
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(mockConversationFindFirst).toHaveBeenCalledWith({
      where: { id: "conversation-1", ownerId: "owner-a" },
    });
  });

  test("message history includes both ownerId and conversationId", async () => {
    await MessageModel.recentByOwnerConversation(
      "owner-a",
      "conversation-1",
      100
    );

    expect(mockMessageFindMany).toHaveBeenCalledWith({
      where: { ownerId: "owner-a", conversationId: "conversation-1" },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
  });

  test("daily usage is read from the authenticated owner counter", async () => {
    await ActivityLogModel.getDailyUsage("owner-a");

    const args = mockUsageFindUnique.mock.calls[0]?.[0];
    expect(args.where.ownerId_date.ownerId).toBe("owner-a");
    expect(args.where.ownerId_date.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
