import { ApiResponse } from '../types';

export const extractData = <T>(response: any): T => {
  const apiResponse = response.data as ApiResponse<T>;
  if (!apiResponse.success) {
    throw new Error(apiResponse.message || 'Request failed');
  }
  return apiResponse.data;
};