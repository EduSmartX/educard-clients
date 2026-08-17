/**
 * Feedback Types
 *
 * Mirrors the backend `edusphere.feedback` module.
 *
 * @module types/feedback
 */

import type { AuditFields } from "./common";
import type { FeedbackModule, FeedbackType } from "../constants";

export interface FeedbackAttachment {
  public_id: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  file_size: number;
}

export interface Feedback extends AuditFields {
  public_id: string;
  organization_public_id: string;
  user_public_id: string;
  user_name: string;
  user_role: string;
  feedback_type: FeedbackType;
  feedback_type_display: string;
  /** Empty string when the user did not pick a module. */
  module: FeedbackModule | "";
  module_display: string;
  subject: string;
  description: string;
  attachments: FeedbackAttachment[];
}

export interface FeedbackQueryParams {
  page?: number;
  page_size?: number;
  feedback_type?: FeedbackType;
  module?: FeedbackModule;
  search?: string;
  ordering?: string;
}

export interface Review extends AuditFields {
  public_id: string;
  organization_public_id: string;
  user_public_id: string;
  user_name: string;
  user_role: string;
  rating: number;
  review: string;
}

export interface ReviewPayload {
  rating: number;
  review?: string;
}
