const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const { buildAdminCrud } = require('../../utils/crud');

const listTeam = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM team WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC'
  );
  ok(res, result.rows);
});

const allowedFields = ['name', 'designation', 'bio', 'photo', 'linkedin_url', 'sort_order', 'is_active'];
const adminCrud = buildAdminCrud('team', { allowedFields, defaultOrder: 'sort_order ASC, id ASC' });

module.exports = {
  listTeam,
  adminList: adminCrud.list,
  adminGetOne: adminCrud.getOne,
  createTeamMember: adminCrud.create,
  updateTeamMember: adminCrud.update,
  removeTeamMember: adminCrud.remove,
};
