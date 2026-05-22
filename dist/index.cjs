
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
    
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/app.ts
var import_express3 = __toESM(require("express"), 1);

// src/middleware/logger.ts
var import_colors = require("kleur/colors");
var logger = (req, res, next) => {
  console.log(`[${(0, import_colors.green)((/* @__PURE__ */ new Date()).toLocaleString())}]`, (0, import_colors.italic)(req.method), (0, import_colors.blue)(req.url));
  next();
};
var logger_default = logger;

// src/config/index.ts
var import_process = require("process");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config({ quiet: true });
var config = {
  database_url: import_process.env.DATABASE_URL,
  port: import_process.env.PORT,
  secret: import_process.env.JWT_SECRET,
  refresh_secret: import_process.env.JWT_REFRESH_SECRET,
  node_env: import_process.env.NODE_ENV
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
var import_express = require("express");

// src/api/controllers/auth.controller.ts
var import_http_status_codes = require("http-status-codes");

// src/api/services/auth.service.ts
var import_bcrypt = __toESM(require("bcrypt"), 1);

// src/db/index.ts
var import_serverless = require("@neondatabase/serverless");

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
var sql = (0, import_serverless.neon)(config.database_url);
var initDB = async () => {
  await createSchema();
  console.log("Database connected successfully!");
};

// src/api/services/auth.service.ts
var AuthService = class {
  async hashPassword(password) {
    return await import_bcrypt.default.hash(password, 10);
  }
  async comparePassword(password, hash) {
    return await import_bcrypt.default.compare(password, hash);
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
function sendResponse(res, { message, data, error }, status = 200) {
  res.status(status).json({
    success: error ? false : true,
    message,
    data: error ? void 0 : data
  });
}

// src/utils/jwt.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var verifyToken = (token) => {
  return import_jsonwebtoken.default.verify(token, config.secret);
};
var signToken = (payload) => {
  return import_jsonwebtoken.default.sign(payload, config.secret, {
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
      import_http_status_codes.StatusCodes.BAD_REQUEST
    );
  }
  if (role && role !== "contributor" && role !== "maintainer") {
    return sendResponse(
      res,
      {
        error: true,
        message: "Role must be contributor or maintainer"
      },
      import_http_status_codes.StatusCodes.BAD_REQUEST
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
      import_http_status_codes.StatusCodes.CONFLICT
    );
  }
  return sendResponse(
    res,
    {
      message: "User registered successfully",
      data: user
    },
    import_http_status_codes.StatusCodes.CREATED
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
      import_http_status_codes.StatusCodes.BAD_REQUEST
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
      import_http_status_codes.StatusCodes.UNAUTHORIZED
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
    import_http_status_codes.StatusCodes.OK
  );
};

// src/api/routes/auth.route.ts
var router = (0, import_express.Router)();
router.post("/signup", signup);
router.post("/login", login);
var auth_route_default = router;

// src/api/routes/issue.route.ts
var import_express2 = require("express");

// src/middleware/auth.ts
var import_http_status_codes2 = require("http-status-codes");
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
        import_http_status_codes2.StatusCodes.UNAUTHORIZED
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
        import_http_status_codes2.StatusCodes.NOT_FOUND
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
      import_http_status_codes2.StatusCodes.UNAUTHORIZED
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
        import_http_status_codes2.StatusCodes.UNAUTHORIZED
      );
    }
    if (!roles.includes(req.user.role)) {
      return sendResponse(
        res,
        {
          error: true,
          message: "Forbidden"
        },
        import_http_status_codes2.StatusCodes.FORBIDDEN
      );
    }
    next();
  };
};

// src/api/controllers/issue.controller.ts
var import_http_status_codes3 = require("http-status-codes");

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
      import_http_status_codes3.StatusCodes.BAD_REQUEST
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
      import_http_status_codes3.StatusCodes.BAD_REQUEST
    );
  }
  return sendResponse(
    res,
    {
      message: "Issue created successfully",
      data: issue
    },
    import_http_status_codes3.StatusCodes.CREATED
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
    import_http_status_codes3.StatusCodes.OK
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
      import_http_status_codes3.StatusCodes.NOT_FOUND
    );
  }
  return sendResponse(
    res,
    {
      message: "Issue fetched successfully",
      data: issue
    },
    import_http_status_codes3.StatusCodes.OK
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
      import_http_status_codes3.StatusCodes.NOT_FOUND
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
        import_http_status_codes3.StatusCodes.FORBIDDEN
      );
    }
    if (issue.status !== "open") {
      return sendResponse(
        res,
        {
          error: true,
          message: "Cannot update non-open issue"
        },
        import_http_status_codes3.StatusCodes.CONFLICT
      );
    }
  }
  const payload = {
    title: req.body.title,
    description: req.body.description,
    type: req.body.type
  };
  const updated = await issue_service_default.updateIssue(issueId, payload);
  if (!updated) {
    return sendResponse(
      res,
      {
        error: true,
        message: "Failed to update issue"
      },
      import_http_status_codes3.StatusCodes.BAD_REQUEST
    );
  }
  return sendResponse(
    res,
    {
      message: "Issue updated successfully",
      data: updated
    },
    import_http_status_codes3.StatusCodes.OK
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
      import_http_status_codes3.StatusCodes.NOT_FOUND
    );
  }
  return sendResponse(
    res,
    {
      message: "Issue deleted successfully"
    },
    import_http_status_codes3.StatusCodes.OK
  );
};

// src/api/routes/issue.route.ts
var router2 = (0, import_express2.Router)();
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
var app = (0, import_express3.default)();
app.use(import_express3.default.json());
app.use(logger_default);
app.use("/api/auth", auth_route_default);
app.use("/api/issues", issue_route_default);
app.get("/", (req, res) => {
  res.send("Hello world");
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
//# sourceMappingURL=index.cjs.map