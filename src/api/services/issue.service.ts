import { sql } from "../../db";

class IssueService {
  async createIssue(
    title: string,
    description: string,
    type:
      | "bug"
      | "feature_request",
    reporterId: number
  ) {
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
}

export default new IssueService();