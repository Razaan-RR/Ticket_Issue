
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
    

// src/app.ts
import express from "express";
import cors from "cors";

// src/middleware/logger.ts
import { blue, green, italic } from "kleur/colors";
var logger = (req, res, next) => {
  console.log(`[${green((/* @__PURE__ */ new Date()).toLocaleString())}]`, italic(req.method), blue(req.url));
  next();
};
var logger_default = logger;

// src/config/index.ts
import { env } from "process";
import dotenv from "dotenv";
dotenv.config({ quiet: true });
var config = {
  database_url: env.DATABASE_URL,
  port: env.PORT,
  secret: env.JWT_SECRET,
  refresh_secret: env.JWT_REFRESH_SECRET,
  node_env: env.NODE_ENV
};

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err instanceof Error ? err.message : "Internal Server Error",
    stack: config.node_env === "development" && err instanceof Error ? err.stack : void 0
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/api/routes/auth.route.ts
import { Router } from "express";

// src/api/controllers/auth.controller.ts
import { StatusCodes } from "http-status-codes";

// src/api/services/auth.service.ts
import bcrypt from "bcrypt";

// src/db/index.ts
import { neon } from "@neondatabase/serverless";

// src/db/schema.ts
var createSchema = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS issues (
      id SERIAL PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
      type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature_request')),
      status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
      reporter_id INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
};

// src/db/index.ts
var sql = neon(config.database_url);
var initDB = async () => {
  await createSchema();
  console.log("Database connected successfully!");
};

// src/api/services/auth.service.ts
var AuthService = class {
  async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
  async createUser(user) {
    const { name, email, password, role } = user;
    const existingUser = await sql`
      SELECT id
      FROM users
      WHERE email = ${email}
    `;
    if (existingUser.length > 0) {
      return null;
    }
    const passwordHash = await this.hashPassword(password);
    const result = await sql`
      INSERT INTO users (
        name,
        email,
        password_hash,
        role
      )
      VALUES (
        ${name},
        ${email},
        ${passwordHash},
        COALESCE(${role}, 'contributor')
      )

      RETURNING
        id,
        name,
        email,
        role,
        created_at,
        updated_at
    `;
    return result[0];
  }
  async validateUser(email, password) {
    const result = await sql`
      SELECT *
      FROM users
      WHERE email = ${email}
    `;
    if (result.length === 0) {
      return null;
    }
    const user = result[0];
    const isPasswordMatched = await this.comparePassword(
      password,
      user.password_hash
    );
    if (!isPasswordMatched) {
      return null;
    }
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }
  async getUserById(id) {
    const result = await sql`
      SELECT
        id,
        name,
        email,
        role,
        created_at,
        updated_at
      FROM users
      WHERE id = ${id}
    `;
    if (result.length === 0) {
      return null;
    }
    return result[0];
  }
};
var auth_service_default = new AuthService();

// src/utils/sendResponse.ts
function sendResponse(res, {
  message,
  data,
  errors,
  error
}, status = 200) {
  return res.status(status).json({
    success: !error,
    message,
    ...error ? { errors } : { data }
  });
}

// src/utils/jwt.ts
import jwt from "jsonwebtoken";
var verifyToken = (token) => {
  return jwt.verify(token, config.secret);
};
var signToken = (payload) => {
  return jwt.sign(payload, config.secret, {
    expiresIn: "7d"
  });
};

// src/api/controllers/auth.controller.ts
var signup = async (req, res) => {
  const {
    name,
    email,
    password,
    role
  } = req.body;
  if (!name || !email || !password) {
    return sendResponse(
      res,
      {
        error: true,
        message: "Name, email and password are required"
      },
      StatusCodes.BAD_REQUEST
    );
  }
  if (role && role !== "contributor" && role !== "maintainer") {
    return sendResponse(
      res,
      {
        error: true,
        message: "Role must be contributor or maintainer"
      },
      StatusCodes.BAD_REQUEST
    );
  }
  const user = await auth_service_default.createUser({
    name,
    email,
    password,
    role
  });
  if (!user) {
    return sendResponse(
      res,
      {
        error: true,
        message: "Email already exists"
      },
      StatusCodes.CONFLICT
    );
  }
  return sendResponse(
    res,
    {
      message: "User registered successfully",
      data: user
    },
    StatusCodes.CREATED
  );
};
var login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return sendResponse(
      res,
      {
        error: true,
        message: "Email and password are required"
      },
      StatusCodes.BAD_REQUEST
    );
  }
  const user = await auth_service_default.validateUser(
    email,
    password
  );
  if (!user) {
    return sendResponse(
      res,
      {
        error: true,
        message: "Invalid email or password"
      },
      StatusCodes.UNAUTHORIZED
    );
  }
  const token = signToken({
    id: user.id,
    name: user.name,
    role: user.role
  });
  return sendResponse(
    res,
    {
      message: "Login successful",
      data: {
        token,
        user
      }
    },
    StatusCodes.OK
  );
};

// src/api/routes/auth.route.ts
var router = Router();
router.post("/signup", signup);
router.post("/login", login);
var auth_route_default = router;

// src/api/routes/issue.route.ts
import { Router as Router2 } from "express";

// src/middleware/auth.ts
import { StatusCodes as StatusCodes2 } from "http-status-codes";
var auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return sendResponse(
        res,
        {
          error: true,
          message: "Authentication required"
        },
        StatusCodes2.UNAUTHORIZED
      );
    }
    const payload = verifyToken(token);
    const user = await auth_service_default.getUserById(payload.id);
    if (!user) {
      return sendResponse(
        res,
        {
          error: true,
          message: "User not found"
        },
        StatusCodes2.NOT_FOUND
      );
    }
    req.user = {
      id: user.id,
      name: user.name,
      role: user.role
    };
    next();
  } catch {
    return sendResponse(
      res,
      {
        error: true,
        message: "Invalid or expired token"
      },
      StatusCodes2.UNAUTHORIZED
    );
  }
};
var authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendResponse(
        res,
        {
          error: true,
          message: "Unauthorized"
        },
        StatusCodes2.UNAUTHORIZED
      );
    }
    if (!roles.includes(req.user.role)) {
      return sendResponse(
        res,
        {
          error: true,
          message: "Forbidden"
        },
        StatusCodes2.FORBIDDEN
      );
    }
    next();
  };
};

// src/api/controllers/issue.controller.ts
import { StatusCodes as StatusCodes3 } from "http-status-codes";

// src/api/services/issue.service.ts
var IssueService = class {
  async createIssue(title, description, type, reporterId) {
    const result = await sql`
      INSERT INTO issues (
        title,
        description,
        type,
        reporter_id
      )

      VALUES (
        ${title},
        ${description},
        ${type},
        ${reporterId}
      )

      RETURNING *
    `;
    return result[0];
  }
  async getAllIssues(sort = "newest", type, status) {
    let query = sql`
      SELECT *
      FROM issues
    `;
    if (type) {
      query = sql`
        SELECT *
        FROM issues
        WHERE type = ${type}
      `;
    }
    if (status) {
      query = type ? sql`
            SELECT *
            FROM issues
            WHERE type = ${type}
            AND status = ${status}
          ` : sql`
            SELECT *
            FROM issues
            WHERE status = ${status}
          `;
    }
    const issues = await query;
    issues.sort((a, b) => sort === "newest" ? b.id - a.id : a.id - b.id);
    const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];
    const users = reporterIds.length > 0 ? await sql`
            SELECT
              id,
              name,
              role

            FROM users

            WHERE id = ANY(
              ${reporterIds}
            )
          ` : [];
    return issues.map((issue) => ({
      ...issue,
      reporter: users.find((u) => u.id === issue.reporter_id)
    }));
  }
  async getIssueById(id) {
    const result = await sql`
      SELECT *

      FROM issues

      WHERE id = ${id}
    `;
    if (result.length === 0) {
      return null;
    }
    const issue = result[0];
    const reporter = await sql`
        SELECT
          id,
          name,
          role

        FROM users

        WHERE id =
        ${issue.reporter_id}
      `;
    return {
      ...issue,
      reporter: reporter[0]
    };
  }
  async getIssueRaw(id) {
    const result = await sql`
      SELECT *

      FROM issues

      WHERE id = ${id}
    `;
    if (result.length === 0) {
      return null;
    }
    return result[0];
  }
  async updateIssue(id, payload) {
    const current = await this.getIssueRaw(id);
    if (!current) {
      return null;
    }
    const result = await sql`
      UPDATE issues

      SET

      title =
      COALESCE(
        ${payload.title},
        ${current.title}
      ),

      description =
      COALESCE(
        ${payload.description},
        ${current.description}
      ),

      type =
      COALESCE(
        ${payload.type},
        ${current.type}
      ),

      status =
      COALESCE(
        ${payload.status},
        ${current.status}
      ),

      updated_at =
      NOW()

      WHERE id =
      ${id}

      RETURNING *
    `;
    return result[0];
  }
  async deleteIssue(id) {
    const result = await sql`
    DELETE FROM issues

    WHERE id = ${id}

    RETURNING *
  `;
    if (result.length === 0) {
      return null;
    }
    return result[0];
  }
};
var issue_service_default = new IssueService();

// src/api/controllers/issue.controller.ts
var createIssue = async (req, res) => {
  const { title, description, type } = req.body;
  if (!title || !description || !type) {
    return sendResponse(
      res,
      {
        error: true,
        message: "Title, description and type are required"
      },
      StatusCodes3.BAD_REQUEST
    );
  }
  const issue = await issue_service_default.createIssue(
    title,
    description,
    type,
    req.user.id
  );
  if (!issue) {
    return sendResponse(
      res,
      {
        error: true,
        message: "Failed to create issue"
      },
      StatusCodes3.BAD_REQUEST
    );
  }
  return sendResponse(
    res,
    {
      message: "Issue created successfully",
      data: issue
    },
    StatusCodes3.CREATED
  );
};
var getAllIssues = async (req, res) => {
  const { sort = "newest", type, status } = req.query;
  const issues = await issue_service_default.getAllIssues(
    sort,
    type,
    status
  );
  return sendResponse(
    res,
    {
      message: "Issues fetched successfully",
      data: issues
    },
    StatusCodes3.OK
  );
};
var getIssue = async (req, res) => {
  const issue = await issue_service_default.getIssueById(Number(req.params.id));
  if (!issue) {
    return sendResponse(
      res,
      {
        error: true,
        message: "Issue not found"
      },
      StatusCodes3.NOT_FOUND
    );
  }
  return sendResponse(
    res,
    {
      message: "Issue fetched successfully",
      data: issue
    },
    StatusCodes3.OK
  );
};
var updateIssue = async (req, res) => {
  const issueId = Number(req.params.id);
  const issue = await issue_service_default.getIssueRaw(issueId);
  if (!issue) {
    return sendResponse(
      res,
      {
        error: true,
        message: "Issue not found"
      },
      StatusCodes3.NOT_FOUND
    );
  }
  const user = req.user;
  const isMaintainer = user.role === "maintainer";
  const isOwner = issue.reporter_id === user.id;
  if (!isMaintainer) {
    if (!isOwner) {
      return sendResponse(
        res,
        {
          error: true,
          message: "Forbidden"
        },
        StatusCodes3.FORBIDDEN
      );
    }
    if (issue.status !== "open") {
      return sendResponse(
        res,
        {
          error: true,
          message: "Cannot update non-open issue"
        },
        StatusCodes3.CONFLICT
      );
    }
  }
  const payload = {
    title: req.body.title,
    description: req.body.description,
    type: req.body.type,
    status: req.body.status
  };
  const updated = await issue_service_default.updateIssue(issueId, payload);
  if (!updated) {
    return sendResponse(
      res,
      {
        error: true,
        message: "Failed to update issue"
      },
      StatusCodes3.BAD_REQUEST
    );
  }
  return sendResponse(
    res,
    {
      message: "Issue updated successfully",
      data: updated
    },
    StatusCodes3.OK
  );
};
var deleteIssue = async (req, res) => {
  const issueId = Number(req.params.id);
  const deleted = await issue_service_default.deleteIssue(issueId);
  if (!deleted) {
    return sendResponse(
      res,
      {
        error: true,
        message: "Issue not found"
      },
      StatusCodes3.NOT_FOUND
    );
  }
  return sendResponse(
    res,
    {
      message: "Issue deleted successfully"
    },
    StatusCodes3.OK
  );
};

// src/api/routes/issue.route.ts
var router2 = Router2();
router2.post("/", auth, createIssue);
router2.get("/", getAllIssues);
router2.get("/:id", getIssue);
router2.patch("/:id", auth, updateIssue);
router2.delete(
  "/:id",
  auth,
  authorizeRoles("maintainer"),
  deleteIssue
);
var issue_route_default = router2;

// src/app.ts
var app = express();
app.use(cors());
app.use(express.json());
app.use(logger_default);
app.use("/api/auth", auth_route_default);
app.use("/api/issues", issue_route_default);
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DevPulse API running"
  });
});
app.use(globalErrorHandler_default);
var app_default = app;

// src/index.ts
var main = async () => {
  await initDB();
  app_default.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
};
main();
//# sourceMappingURL=index.js.map