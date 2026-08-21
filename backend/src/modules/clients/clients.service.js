// Shared with leads.controller.js's convert handler (2 call sites: the "won" lead path here, and
// potentially a future direct-add path) — kept as its own thin service rather than inlined in the
// leads module, so the lead→client field mapping lives next to the table it actually writes to.
async function createClientFromLead(client, lead) {
  const result = await client.query(
    `INSERT INTO clients (name, email, phone, company, industry, notes, lead_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [lead.name, lead.email, lead.phone, lead.company, lead.service_interested || null, lead.notes, lead.id]
  );
  return result.rows[0];
}

module.exports = { createClientFromLead };
