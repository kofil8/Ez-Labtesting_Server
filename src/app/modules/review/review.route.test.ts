jest.mock('../../middlewares/auth', () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn()),
}));

describe('ReviewRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('uses generic auth() for the current-user route and all mutations', async () => {
    const auth = (await import('../../middlewares/auth')).default as jest.Mock;

    await import('./review.route');

    expect(auth).toHaveBeenCalledTimes(5);
    expect(auth.mock.calls).toEqual([[], [], [], [], []]);
  });
});
