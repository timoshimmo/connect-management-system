const asyncHandler = require('../../utils/asyncHandler');
const documentService = require('./document.service');
const { parsePagination, paginatedResponse } = require('../../common/pagination');
const { ForbiddenError } = require('../../common/errors');
const { buildPublicUrl } = require('../../config/r2');
const { createPresignedUploadUrl } = require('../../middlewares/upload');

// Mints presigned R2 PUT URLs so the browser can upload file bytes directly
// to storage, bypassing our serverless function's request-body size cap
// entirely (Vercel hard-caps that at ~4.5MB — see createPresignedUploadUrl's
// doc comment in middlewares/upload.js). Batch-capable: serves both the
// single-file create/edit case and the many-file bulk-import case through
// one endpoint.
const getUploadUrls = asyncHandler(async (req, res) => {
  const files = await Promise.all(
    req.body.files.map(({ filename, mimeType }) => createPresignedUploadUrl({ filename, mimeType }))
  );
  res.json({
    files: files.map((f, i) => ({
      key: f.key,
      uploadUrl: f.uploadUrl,
      contentDisposition: f.contentDisposition,
      originalFilename: req.body.files[i].filename,
      mimeType: req.body.files[i].mimeType,
      size: req.body.files[i].size,
    })),
  });
});

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { items, total } = await documentService.listDocuments({
    department: req.query.department,
    type: req.query.type,
    status: req.query.status,
    search: req.query.search,
    skip,
    limit,
  });
  res.json(paginatedResponse(items, total, page, limit));
});

const getOne = asyncHandler(async (req, res) => {
  const doc = await documentService.getDocumentById(req.params.id);
  res.json({ document: doc });
});

const create = asyncHandler(async (req, res) => {
  // Document Register documents are Controller-registered controlled
  // documents (no author/reviewer/approver workflow) — enforced here, not
  // just by hiding the "Create Document Register Document" button, since
  // the route itself is also reachable by any 'author'.
  if (req.body.destination === 'Document Register' && req.user.role !== 'controller') {
    throw new ForbiddenError('Only a Document Controller can create Document Register documents.');
  }

  const doc = await documentService.createDocument({
    ...req.body,
    authorId: req.user.id,
  });
  res.status(201).json({ document: doc });
});

const update = asyncHandler(async (req, res) => {
  const doc = await documentService.updateDocument(req.params.id, req.user.id, req.user.role, req.body);
  res.json({ document: doc });
});

const addVersion = asyncHandler(async (req, res) => {
  const version = await documentService.addVersion(req.params.id, {
    fileRef: req.body.fileRef,
    changeNote: req.body.changeNote,
    uploadedBy: req.user.id,
  });
  res.status(201).json({ version });
});

const listVersions = asyncHandler(async (req, res) => {
  const versions = await documentService.getVersions(req.params.id);
  res.json({ items: versions });
});

const submitForReview = asyncHandler(async (req, res) => {
  const doc = await documentService.submitForReview(req.params.id, req.user.id);
  res.json({ document: doc });
});

const assign = asyncHandler(async (req, res) => {
  const doc = await documentService.assignReviewerApprover(req.params.id, req.body, req.user.id);
  res.json({ document: doc });
});

const reassign = asyncHandler(async (req, res) => {
  const doc = await documentService.reassignReviewerApprover(req.params.id, req.body, req.user.id);
  res.json({ document: doc });
});

const forward = asyncHandler(async (req, res) => {
  const doc = await documentService.forwardToApproval(req.params.id, req.user.id);
  res.json({ document: doc });
});

const returnToAuthor = asyncHandler(async (req, res) => {
  const doc = await documentService.returnToAuthor(req.params.id, req.user.id, req.body.notes);
  res.json({ document: doc });
});

const approve = asyncHandler(async (req, res) => {
  const doc = await documentService.approve(req.params.id, req.user.id);
  res.json({ document: doc });
});

const reject = asyncHandler(async (req, res) => {
  const doc = await documentService.reject(req.params.id, req.user.id);
  res.json({ document: doc });
});

const publish = asyncHandler(async (req, res) => {
  const doc = await documentService.publish(req.params.id, req.user.id);
  res.json({ document: doc });
});

const rejectPublishing = asyncHandler(async (req, res) => {
  const doc = await documentService.rejectPublishing(req.params.id, req.user.id);
  res.json({ document: doc });
});

const archive = asyncHandler(async (req, res) => {
  const doc = await documentService.archive(req.params.id, req.user.id, req.body.reason);
  res.json({ document: doc });
});

const restore = asyncHandler(async (req, res) => {
  const doc = await documentService.restore(req.params.id, req.user.id);
  res.json({ document: doc });
});

const initiateRevision = asyncHandler(async (req, res) => {
  const doc = await documentService.initiateRevision(req.params.id, req.user.id);
  res.json({ document: doc });
});

const download = asyncHandler(async (req, res) => {
  const version = await documentService.recordDownload(req.params.id, req.user.id);
  res.json({ url: buildPublicUrl(version.file.key), fileName: `${version.versionNumber}.${version.file.format}` });
});

const preview = asyncHandler(async (req, res) => {
  const version = await documentService.recordPreview(req.params.id, req.user.id);
  res.json({ url: buildPublicUrl(version.file.key), format: version.file.format });
});

module.exports = {
  list,
  getOne,
  getUploadUrls,
  create,
  update,
  addVersion,
  listVersions,
  submitForReview,
  assign,
  reassign,
  forward,
  returnToAuthor,
  approve,
  reject,
  publish,
  rejectPublishing,
  archive,
  restore,
  initiateRevision,
  download,
  preview,
};
