export const roles = ["contributor", "maintainer"] as const;

export type Role = (typeof roles)[number];

// export const issueTypes = ["bug", "feature_request"] as const;

// export type IssueType = (typeof issueTypes)[number];

// export const issueStatuses = [
//   "open",
//   "in_progress",
//   "resolved",
// ] as const;

// export type IssueStatus = (typeof issueStatuses)[number];



export type User = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: Date;
  updated_at: Date;
};


export type SafeUser = Omit<User, "password_hash">;


export type CreateUser = {
  name: string;
  email: string;
  password: string;
  role: Role;
};


export type LoginUser = {
  email: string;
  password: string;
};



// export type Issue = {
//   id: number;
//   title: string;
//   description: string;
//   type: IssueType;
//   status: IssueStatus;
//   reporter_id: number;
//   created_at: Date;
//   updated_at: Date;
// };


// export type CreateIssue = {
//   title: string;
//   description: string;
//   type: IssueType;
// };


// export type UpdateIssue = {
//   title?: string;
//   description?: string;
//   type?: IssueType;
//   status?: IssueStatus;
// };


// export type IssueWithReporter = {
//   id: number;
//   title: string;
//   description: string;
//   type: IssueType;
//   status: IssueStatus;

//   reporter: {
//     id: number;
//     name: string;
//     role: Role;
//   };

//   created_at: Date;
//   updated_at: Date;
// };




// export type JwtPayload = {
//   id: number;
//   name: string;
//   role: Role;
// };