const { ContactMessage } = require('./contactMessage.model');
const { Department } = require('../departments/department.model');
const { Document } = require('../documents/document.model');
const { recordAudit } = require('../auditLogs/auditLog.service');
const { notifyRole } = require('../notifications/notification.service');
const { NotFoundError } = require('../../common/errors');

const SOURCE_LABEL = { 'read-site': 'the Read Site', 'drawing-register': 'the Drawing Register' };

/**
 * Shared by both storefronts' "Contact Document Controller" — see
 * readSite.controller.js (public, `source: 'read-site'`) and
 * drawingRegisterContent.controller.js (gated, `source: 'drawing-register'`,
 * carries the submitter's Drawing Register identity).
 */
async function createMessage({ subject, message, department, relatedDocument, source, drawingRegisterUserId }) {
  if (department) {
    const dept = await Department.findById(department);
    if (!dept) throw new NotFoundError('Department not found');
  }
  if (relatedDocument) {
    const doc = await Document.findById(relatedDocument);
    if (!doc) throw new NotFoundError('Document not found');
  }

  const contactMessage = await ContactMessage.create({
    subject,
    message,
    department: department || null,
    relatedDocument: relatedDocument || null,
    source,
    fromDrawingRegisterUser: drawingRegisterUserId || null,
  });

  await recordAudit({
    user: null,
    action: 'edit',
    targetType: 'contactMessage',
    targetId: contactMessage._id,
    metadata: { created: true, source, drawingRegisterUserId: drawingRegisterUserId || null },
  });

  await notifyRole('controller', {
    type: 'contact_message',
    message: `New message from ${SOURCE_LABEL[source]}: "${subject}"`,
    relatedDocument: relatedDocument || undefined,
  });

  return contactMessage;
}

module.exports = { createMessage };
