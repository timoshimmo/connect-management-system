const asyncHandler = require('../../utils/asyncHandler');
const documentService = require('./document.service');
const { parsePagination, paginatedResponse } = require('../../common/pagination');
const { BadRequestError } = require('../../common/errors');
const { buildPublicUrl } = require('../../config/r2');

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
  const doc = await documentService.createDocument({
    ...req.body,
    authorId: req.user.id,
    file: req.file,
  });
  res.status(201).json({ document: doc });
});

const update = asyncHandler(async (req, res) => {
  const doc = await documentService.updateDocument(req.params.id, req.user.id, req.user.role, req.body);
  res.json({ document: doc });
});

const addVersion = asyncHandler(async (req, res) => {
  if (!req.file) throw new BadRequestError('A file is required');
  const version = await documentService.addVersion(req.params.id, {
    file: req.file,
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
  create,
  update,
  addVersion,
  listVersions,
  submitForReview,
  assign,
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
