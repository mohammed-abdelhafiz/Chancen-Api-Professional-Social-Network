export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  headline: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    bio: string | null;
    headline: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = user.id;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.bio = user.bio ?? null;
    this.headline = user.headline ?? null;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
