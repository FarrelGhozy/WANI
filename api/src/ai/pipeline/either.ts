export type Either<E, T> =
  | { ok: false; error: E }
  | { ok: true; value: T }

export function ok<T>(value: T): Either<never, T> {
  return { ok: true, value }
}

export function fail<E>(error: E): Either<E, never> {
  return { ok: false, error }
}

export function map<E, A, B>(e: Either<E, A>, fn: (a: A) => B): Either<E, B> {
  if (e.ok) return ok(fn(e.value))
  return e
}

export function isLeft<E, T>(e: Either<E, T>): e is { ok: false; error: E } {
  return !e.ok
}

export function isRight<E, T>(e: Either<E, T>): e is { ok: true; value: T } {
  return e.ok
}
