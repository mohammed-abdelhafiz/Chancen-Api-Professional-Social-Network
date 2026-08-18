import { JsonValue } from 'generated/prisma/internal/prismaNamespace';

export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  headline: string | null;
  company: string | null;
  avatar: JsonValue;
  coverPhoto: JsonValue;
  resume: JsonValue;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    bio: string | null;
    headline: string | null;
    company: string | null;
    avatar: JsonValue;
    coverPhoto: JsonValue;
    resume: JsonValue;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = user.id;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.bio = user.bio ?? null;
    this.headline = user.headline ?? null;
    this.company = user.company ?? null;
    this.avatar = user.avatar ?? null;
    this.coverPhoto = user.coverPhoto ?? null;
    this.resume = user.resume ?? null;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
