import { describe, it, expect, vi } from 'vitest';
import { asyncHandler } from '../asyncHandler.js';

function mockReq() { return {} as any; }
function mockRes() { return {} as any; }

describe('asyncHandler', () => {
  it('successful async handler — calls handler, no next() with error', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const next = vi.fn();
    const wrapped = asyncHandler(handler);

    await wrapped(mockReq(), mockRes(), next);

    expect(handler).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });

  it('throwing async handler — catches and passes error to next()', async () => {
    const error = new Error('DB connection failed');
    const handler = vi.fn().mockRejectedValue(error);
    const next = vi.fn();
    const wrapped = asyncHandler(handler);

    await wrapped(mockReq(), mockRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('sync error inside async handler — propagates (not caught by Promise.resolve)', async () => {
    // asyncHandler uses Promise.resolve(fn(...)).catch(next)
    // A sync throw happens before Promise.resolve wraps it,
    // so it propagates as an uncaught exception — this is by design.
    const error = new Error('sync kaboom');
    const handler = vi.fn().mockImplementation(() => {
      throw error;
    });
    const next = vi.fn();
    const wrapped = asyncHandler(handler);

    expect(() => wrapped(mockReq(), mockRes(), next)).toThrow('sync kaboom');
    expect(next).not.toHaveBeenCalled();
  });
});
