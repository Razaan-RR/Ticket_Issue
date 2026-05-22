import type {
  Request,
  Response,
} from "express";

import {
  StatusCodes,
} from "http-status-codes";

import issueService from "../services/issue.service.js";

import {
  sendResponse,
} from "../../utils/sendResponse.js";

export const createIssue =
  async (
    req: Request,
    res: Response
  ) => {
    const {
      title,
      description,
      type,
    } = req.body;

    if (
      !title ||
      !description ||
      !type
    ) {
      return sendResponse(
        res,
        {
          error: true,
          message:
            "Title, description and type are required",
        },
        StatusCodes.BAD_REQUEST
      );
    }

    const issue =
      await issueService.createIssue(
        title,
        description,
        type,
        req.user!.id
      );

    if (!issue) {
      return sendResponse(
        res,
        {
          error: true,
          message:
            "Failed to create issue",
        },
        StatusCodes.BAD_REQUEST
      );
    }

    return sendResponse(
      res,
      {
        message:
          "Issue created successfully",
        data: issue,
      },
      StatusCodes.CREATED
    );
  };