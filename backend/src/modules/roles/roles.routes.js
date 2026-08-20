const express = require('express');
const { ROLES } = require('../users/user.model');

const router = express.Router();
module.exports = router;

const ROLE_DESCRIPTIONS = {
  author: 'Creates and submits documents/drawings for review.',
  reviewer: 'Reviews submitted work and forwards it or returns it with comments.',
  approver: 'Gives sign-off on reviewed documents before publishing.',
  controller: 'Full lifecycle control: assigns reviewers/approvers, publishes, and administers the register.',
};

/**
 * @openapi
 * /roles:
 *   get:
 *     tags: [Roles]
 *     summary: List the roles available for role-based access control
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example:
 *               items:
 *                 - { role: "author", description: "Creates and submits documents/drawings for review." }
 */
router.get('/', (req, res) => {
  res.json({ items: ROLES.map((role) => ({ role, description: ROLE_DESCRIPTIONS[role] })) });
});
