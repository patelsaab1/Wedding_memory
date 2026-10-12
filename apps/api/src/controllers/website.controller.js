import { createSuccessResponse } from '@wedding-memory/shared';
import * as websiteService from '../services/website/website.service.js';

export async function listWebsiteSections(req, res) {
  const enabledOnly = req.query.enabledOnly === true;
  const sections = await websiteService.listWebsiteSections({ enabledOnly });
  res.status(200).json(createSuccessResponse(sections));
}

export async function listHomeSections(_req, res) {
  const sections = await websiteService.listWebsiteSections({ enabledOnly: true });
  res.status(200).json(createSuccessResponse(sections));
}
