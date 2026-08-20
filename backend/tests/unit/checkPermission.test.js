jest.mock('../../src/config/db', () => ({ query: jest.fn() }));
const { checkPermission } = require('../../src/middleware/auth');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('checkPermission middleware', () => {
  it('always allows a super_admin, regardless of their permissions array', () => {
    const req = { admin: { role: 'super_admin', permissions: [] } };
    const res = mockRes();
    const next = jest.fn();

    checkPermission('leads.delete')(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows an editor whose permissions include the exact key', () => {
    const req = { admin: { role: 'editor', permissions: ['leads.read', 'leads.update'] } };
    const res = mockRes();
    const next = jest.fn();

    checkPermission('leads.update')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects an editor missing the key with 403', () => {
    const req = { admin: { role: 'editor', permissions: ['leads.read'] } };
    const res = mockRes();
    const next = jest.fn();

    checkPermission('leads.delete')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rejects when permissions is missing entirely (not just empty)', () => {
    const req = { admin: { role: 'editor' } };
    const res = mockRes();
    const next = jest.fn();

    checkPermission('leads.read')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('does not grant read access for a differently-named permission (create vs read)', () => {
    const req = { admin: { role: 'editor', permissions: ['leads.create'] } };
    const res = mockRes();
    const next = jest.fn();

    checkPermission('leads.read')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
