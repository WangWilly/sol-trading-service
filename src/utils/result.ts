////////////////////////////////////////////////////////////////////////////////
// Enhanced Result Pattern for Better Error Handling
////////////////////////////////////////////////////////////////////////////////

export type Result<T, E = Error> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: E;
    };

////////////////////////////////////////////////////////////////////////////////

export class ResultUtils {
  /**
   * Create a successful result
   */
  static ok<T>(data: T): Result<T> {
    return { success: true, data };
  }

  /**
   * Create a failed result with error
   */
  static err<E = Error>(error: E): Result<never, E> {
    return { success: false, error };
  }

  /**
   * Wrap a promise in a result pattern
   */
  static async wrap<T>(promise: Promise<T>): Promise<Result<T>> {
    try {
      const data = await promise;
      return ResultUtils.ok(data);
    } catch (error) {
      return ResultUtils.err(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Wrap a synchronous function in a result pattern
   */
  static wrapSync<T>(fn: () => T): Result<T> {
    try {
      const data = fn();
      return ResultUtils.ok(data);
    } catch (error) {
      return ResultUtils.err(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Chain multiple results together
   */
  static chain<T, U>(result: Result<T>, fn: (data: T) => Result<U>): Result<U> {
    if (result.success) {
      return fn(result.data);
    }
    return result as Result<U>;
  }

  /**
   * Map over a successful result
   */
  static map<T, U>(result: Result<T>, fn: (data: T) => U): Result<U> {
    if (result.success) {
      return ResultUtils.ok(fn(result.data));
    }
    return result as Result<U>;
  }

  /**
   * Check if result is successful
   */
  static isOk<T>(result: Result<T>): result is { success: true; data: T } {
    return result.success;
  }

  /**
   * Check if result is failed
   */
  static isErr<T>(
    result: Result<T>
  ): result is { success: false; error: Error } {
    return !result.success;
  }

  /**
   * Get data from result or throw error
   */
  static unwrap<T>(result: Result<T>): T {
    if (result.success) {
      return result.data;
    }
    throw result.error;
  }

  /**
   * Get data from result or return default value
   */
  static unwrapOr<T>(result: Result<T>, defaultValue: T): T {
    if (result.success) {
      return result.data;
    }
    return defaultValue;
  }
}
