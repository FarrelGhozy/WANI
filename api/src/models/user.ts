import { BaseModel } from "@/src/models/base"

export type UserPublic = {
  id: string
  name: string
  email: string
  role: string
}

export class UserModel extends BaseModel {
  protected static override get delegate() {
    return this.db.user
  }

  static async findByEmail(email: string) {
    return this.delegate.findUnique({ where: { email } }) as Promise<{
      id: string
      name: string
      email: string
      password: string
      role: string
    } | null>
  }

  static async findByResetToken(token: string) {
    return this.delegate.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    }) as Promise<{ id: string; resetPasswordToken: string | null; resetPasswordExpires: Date | null } | null>
  }

  static async createUser(data: {
    name: string
    email: string
    password: string
  }) {
    return this.delegate.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
      select: { id: true, name: true, email: true, role: true },
    }) as Promise<UserPublic>
  }

  static toPublic(user: {
    id: string
    name: string
    email: string
    role: string
  }): UserPublic {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }
  }
}
