const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // nunca exponha isso no frontend!
);

router.post('/invite', async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Nome e email são obrigatórios.' });
  }

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { name }
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ data });
});

module.exports = router;
