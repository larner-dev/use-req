/* eslint-disable @typescript-eslint/no-explicit-any */
import { Req, ReqMethod, ReqCode } from "@larner.dev/req";
import { useMemo, useState } from "react";

export interface ReqError<T extends string> {
  message: string;
  code: ReqCode | T;
  params?: Record<string, any>;
}

interface UseReqState<T, E extends string> {
  loading: boolean;
  error: ReqError<E> | null;
  result: T | null;
}

export interface ExtendedUseReqState<T, E extends string>
  extends UseReqState<T, E> {
  clearError: () => void;
}

export interface RequestMethods_T<T> {
  get: (url: string, params?: any) => void | T | null;
  post: (url: string, params?: any) => void | T | null;
  put: (url: string, params?: any) => void | T | null;
  delete: (url: string, params?: any) => void | T | null;
}

interface AbstractResult {
  success: boolean;
}

interface SuccessResult<T> extends AbstractResult {
  success: true;
  result: T;
}

interface ErrorResult<E extends string> extends AbstractResult {
  success: false;
  error: ReqError<E>;
}

type ReqResult<T, E extends string> = SuccessResult<T> | ErrorResult<E>;

export const useReq = <T, E extends string = string>(request: Req) => {
  const [state, setState] = useState<UseReqState<T, E>>({
    loading: false,
    error: null,
    result: null,
  });

  const req = useMemo(() => {
    const requestWrapper = async (
      method: ReqMethod,
      url: string,
      params: any
    ): Promise<ReqResult<T, E>> => {
      setState({ error: null, loading: true, result: null });
      try {
        const result = await request[method](url, params);
        setState({ error: null, loading: false, result });
        return { success: true, result: result as T };
      } catch (error: any) {
        const formattedError = {
          message: error.message,
          code: error.code || "UNKNOWN",
          params: error.params || undefined,
        };
        setState({
          error: formattedError,
          loading: false,
          result: null,
        });
        return { success: false, error: formattedError };
      }
    };

    return {
      get: (url: string, params?: any) =>
        requestWrapper(ReqMethod.GET, url, params),
      post: (url: string, params: any) =>
        requestWrapper(ReqMethod.POST, url, params),
      put: (url: string, params: any) =>
        requestWrapper(ReqMethod.PUT, url, params),
      delete: (url: string, params: any) =>
        requestWrapper(ReqMethod.DELETE, url, params),
    };
  }, [request]);

  return [
    req,
    {
      ...state,
      clearError: () => setState({ ...state, error: null }),
    } as ExtendedUseReqState<T, E>,
  ] as const;
};
