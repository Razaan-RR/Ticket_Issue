import { sql } from '../../db'

import type {
  Issue,
  IssueStatus,
  IssueType,
  IssueWithReporter,
} from '../../types'

class IssueService {
  async createIssue(
    title: string,
    description: string,
    type: IssueType,
    reporterId: number,
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
    `

    return result[0]
  }

  async getAllIssues(
    sort: 'newest' | 'oldest' = 'newest',

    type?: IssueType,

    status?: IssueStatus,
  ): Promise<IssueWithReporter[]> {
    let query = sql`
      SELECT *
      FROM issues
    `

    if (type) {
      query = sql`
        SELECT *
        FROM issues
        WHERE type = ${type}
      `
    }

    if (status) {
      query = type
        ? sql`
            SELECT *
            FROM issues
            WHERE type = ${type}
            AND status = ${status}
          `
        : sql`
            SELECT *
            FROM issues
            WHERE status = ${status}
          `
    }

    const issues = (await query) as Issue[]

    issues.sort((a, b) => (sort === 'newest' ? b.id - a.id : a.id - b.id))

    const reporterIds = [...new Set(issues.map((i) => i.reporter_id))]

    const users =
      reporterIds.length > 0
        ? await sql`
            SELECT
              id,
              name,
              role
            FROM users
            WHERE id = ANY(
              ${reporterIds}
            )
          `
        : []

    return issues.map((issue) => ({
      ...issue,

      reporter: users.find((u) => u.id === issue.reporter_id)!,
    }))
  }

  async getIssueById(id: number): Promise<IssueWithReporter | null> {
    const result = await sql`
      SELECT *
      FROM issues
      WHERE id = ${id}
    `

    if (result.length === 0) {
      return null
    }

    const issue = result[0] as Issue

    const reporter = await sql`
        SELECT
          id,
          name,
          role
        FROM users
        WHERE id =
        ${issue.reporter_id}
      `

    return {
      ...issue,

      reporter: reporter[0],
    }
  }
}

export default new IssueService()
