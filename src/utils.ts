/** if T1 is undefined, return T2 */
export type Default<T1, T2> = T1 extends undefined ? T2 : T1;

/** T | Promise<T> */
export type MaybePromise<T> = T | Promise<T>;
