/* eslint-disable @typescript-eslint/no-explicit-any */
import { Req, ReqMethod } from "@larner.dev/req";
import { useMemo, useState } from "react";

interface UseReqState<T> {
  loading: boolean;
  error: Error | string | null;
  result: T | null;
}

export interface ExtendedUseReqState<T> extends UseReqState<T> {
  clearError: () => void;
}

export interface RequestMethods_T<T> {
  get: (url: string, params?: any) => void | T | null;
  post: (url: string, params?: any) => void | T | null;
  put: (url: string, params?: any) => void | T | null;
  delete: (url: string, params?: any) => void | T | null;
}

interface UseReqParams {
  baseUrl?: string;
  headers?: Record<string, string>;
  debug?: boolean;
}

export const useReqBuilder =
  (baseParams: UseReqParams) =>
  <T>(params?: UseReqParams) =>
    useReq<T>({ ...baseParams, ...(params || {}) });

export const useReq = <T>(params?: UseReqParams) => {
  const request = useMemo(() => {
    const baseUrl = params?.baseUrl || "";
    const headers = params?.headers || {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const r = new Req(baseUrl);
    r.headers = headers;
    r.debug = !!params?.debug;
    return r;
  }, [params?.baseUrl, params?.headers]);

  const [state, setState] = useState<UseReqState<T>>({
    loading: false,
    error: null,
    result: null,
  });

  const req = useMemo(() => {
    const requestWrapper = async (
      method: ReqMethod,
      url: string,
      params: any
    ) => {
      if (!request[method]) {
        return setState((prev) => ({
          ...prev,
          error: `Unknown request method "${method}"`,
        }));
      }
      setState({ error: null, loading: true, result: null });
      try {
        console.log("req", method, url);
        const result = await request[method](url, params);
        setState({ error: null, loading: false, result });
        return result as T;
      } catch (error: any) {
        setState({
          error: error.message,
          loading: false,
          result: null,
        });
        return null;
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
    } as ExtendedUseReqState<T>,
  ] as const;
};
