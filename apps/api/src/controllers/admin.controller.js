import { createSuccessResponse } from '@wedding-memory/shared';
import * as websiteService from '../services/website/website.service.js';
import * as adminService from '../services/admin/admin.service.js';
import * as guestAccess from '../services/admin/guest-access.service.js';
import * as albumAccess from '../services/admin/album-access.service.js';
import { badRequestError } from '../utils/errors.js';

export async function listAdminSections(_req, res) {
  const sections = await websiteService.listWebsiteSections();
  res.status(200).json(createSuccessResponse(sections));
}

export async function updateAdminSection(req, res) {
  const section = await websiteService.updateHomeSection(req.params.key, req.body);
  res.status(200).json(createSuccessResponse(section));
}

export async function reorderAdminSections(req, res) {
  const sections = await websiteService.reorderHomeSections(req.body.keys);
  res.status(200).json(createSuccessResponse(sections));
}

export async function listAdminFolders(_req, res) {
  const folders = await adminService.listDriveFolders();
  res.status(200).json(createSuccessResponse(folders));
}

export async function createAdminAlbum(req, res) {
  const album = await adminService.createDriveAlbum(req.body.title);
  res.status(201).json(createSuccessResponse(album));
}

export async function listGuestLogins(_req, res) {
  const guests = await guestAccess.listGuestLogins();
  res.status(200).json(createSuccessResponse(guests));
}

export async function createGuestLogin(req, res) {
  const guest = await guestAccess.createGuestLogin(req.body);
  res.status(201).json(createSuccessResponse(guest));
}

export async function endGuestLogin(req, res) {
  const guest = await guestAccess.endGuestLogin(req.params.userId);
  res.status(200).json(createSuccessResponse(guest));
}

export async function listAlbumAccess(_req, res) {
  const access = await albumAccess.listAlbumAccess();
  res.status(200).json(createSuccessResponse(access));
}

export async function updateAlbumAccess(req, res) {
  const access = await albumAccess.saveAlbumAccess(req.params.folderId, req.body);
  res.status(200).json(createSuccessResponse(access));
}

export async function uploadAdminFile(req, res) {
  if (!req.file) {
    throw badRequestError('Choose a photo or film to add');
  }
  const file = await adminService.uploadDriveFile(req.params.folderId, req.file);
  res.status(201).json(createSuccessResponse(file));
}
