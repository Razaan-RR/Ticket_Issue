import type { Request, Response } from "express";

import { StatusCodes } from "http-status-codes";

import authService from "../services/auth.service.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { signToken } from "../../utils/jwt.js";

export const signup = async (
  req: Request,
  res: Response
) => {
  const {
    name,
    email,
    password,
    role,
  } = req.body;

  if (!name || !email || !password) {
    return sendResponse(
      res,
      {
        error: true,
        message:
          "Name, email and password are required",
      },
      StatusCodes.BAD_REQUEST
    );
  }

  if (
    role &&
    role !== "contributor" &&
    role !== "maintainer"
  ) {
    return sendResponse(
      res,
      {
        error: true,
        message:
          "Role must be contributor or maintainer",
      },
      StatusCodes.BAD_REQUEST
    );
  }

  const user =
    await authService.createUser({
      name,
      email,
      password,
      role,
    });

  if (!user) {
    return sendResponse(
      res,
      {
        error: true,
        message:
          "Email already exists",
      },
      StatusCodes.CONFLICT
    );
  }

  return sendResponse(
    res,
    {
      message:
        "User registered successfully",
      data: user,
    },
    StatusCodes.CREATED
  );
};

export const login = async (
  req: Request,
  res: Response
) => {
  const { email, password } =
    req.body;

  if (!email || !password) {
    return sendResponse(
      res,
      {
        error: true,
        message:
          "Email and password are required",
      },
      StatusCodes.BAD_REQUEST
    );
  }

  const user =
    await authService.validateUser(
      email,
      password
    );

  if (!user) {
    return sendResponse(
      res,
      {
        error: true,
        message:
          "Invalid email or password",
      },
      StatusCodes.UNAUTHORIZED
    );
  }

  const token = signToken({
    id: user.id,
    name: user.name,
    role: user.role,
  });

  return sendResponse(
    res,
    {
      message: "Login successful",
      data: {
        token,
        user,
      },
    },
    StatusCodes.OK
  );
};