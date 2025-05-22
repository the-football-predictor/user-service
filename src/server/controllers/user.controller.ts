import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import UserModel, { User } from '../../models/user.model';
import jwt from 'jsonwebtoken';
import env from '../../common/config/env';
import { registerUserSchema, loginUserSchema, updateUserProfileSchema } from '../schemas/user.schema';
import { Password } from 'bun';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
// Ensure AuthenticatedRequest is available if you are type-hinting req: AuthenticatedRequest

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { body } = await registerUserSchema.parseAsync(req); // Validates req.body

    const existingByEmail = await UserModel.getUserByEmail(body.email);
    if (existingByEmail) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Email already exists' });
    }

    const existingByUsername = await UserModel.getUserByUsername(body.username);
    if (existingByUsername) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Username already exists' });
    }

    const newUser = await UserModel.createUser(body.username, body.email, body.password);

    // Ensure newUser and user_id exist before creating token
    if (!newUser || typeof newUser.user_id === 'undefined') {
       console.error('User creation did not return expected user object with user_id');
       return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error creating user account.' });
    }

    const token = jwt.sign(
      { userId: newUser.user_id, email: newUser.email },
      env.jwt_secret as string, // Cast to string as it could be undefined if not set
      { expiresIn: env.expiresIn }
    );

    // Exclude password_hash from the returned user object
    const userResponse = {
      user_id: newUser.user_id,
      username: newUser.username,
      email: newUser.email,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at
    };

    return res.status(StatusCodes.CREATED).json({ user: userResponse, token });
  } catch (error: any) {
    if (error.errors) { // Zod validation error
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Validation failed", errors: error.errors });
    }
    console.error('Error in registerUser:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

export const deleteUserProfile = async (req: Request, res: Response) => { // Or req: AuthenticatedRequest
  const authenticatedRequest = req as AuthenticatedRequest;
  if (!authenticatedRequest.user || typeof authenticatedRequest.user.userId === 'undefined') {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authentication details not found.' });
  }
  const userId = authenticatedRequest.user.userId;

  try {
    // First, check if the user exists and is not already soft-deleted
    const user = await UserModel.getUserById(userId);
    if (!user || user.deleted_at) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found or already deactivated' });
    }

    await UserModel.deleteUser(userId); // This performs a soft delete

    return res.status(StatusCodes.OK).json({ message: 'User account deactivated successfully' });
    // Or use StatusCodes.NO_CONTENT and res.status(StatusCodes.NO_CONTENT).send();
    // Using OK with a message is often clearer for the client.
  } catch (error: any) {
    console.error('Error in deleteUserProfile:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => { // Or req: AuthenticatedRequest
  const authenticatedRequest = req as AuthenticatedRequest;
  if (!authenticatedRequest.user || typeof authenticatedRequest.user.userId === 'undefined') {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authentication details not found.' });
  }
  const userId = authenticatedRequest.user.userId;

  try {
    const { body } = await updateUserProfileSchema.parseAsync(req);

    // Check for conflicts if email/username is being changed
    if (body.email) {
      const existingByEmail = await UserModel.getUserByEmail(body.email);
      if (existingByEmail && existingByEmail.user_id !== userId) {
        return res.status(StatusCodes.CONFLICT).json({ message: 'Email already taken by another user' });
      }
    }
    if (body.username) {
      const existingByUsername = await UserModel.getUserByUsername(body.username);
      if (existingByUsername && existingByUsername.user_id !== userId) {
        return res.status(StatusCodes.CONFLICT).json({ message: 'Username already taken by another user' });
      }
    }

    // Construct updates object, ensuring not to pass undefined values that aren't explicitly set
    const updates: Partial<User> = {};
    if (body.username) updates.username = body.username;
    if (body.email) updates.email = body.email;
    // The UserModel.updateUser already sets updated_at
    // updates.updated_at = new Date(); // This is handled by the model or database trigger ideally

    if (Object.keys(updates).length === 0) {
       return res.status(StatusCodes.BAD_REQUEST).json({ message: "No update fields provided." });
    }

    const updatedUser = await UserModel.updateUser(userId, updates);

    if (!updatedUser) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found or update failed' });
    }

    const userResponse = {
      user_id: updatedUser.user_id,
      username: updatedUser.username,
      email: updatedUser.email,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    };

    return res.status(StatusCodes.OK).json(userResponse);
  } catch (error: any) {
    if (error.errors) { // Zod validation error
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Validation failed", errors: error.errors });
    }
    console.error('Error in updateUserProfile:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

export const getUserProfile = async (req: Request, res: Response) => { // Or req: AuthenticatedRequest
  // The 'user' property is added by authenticateJWT middleware
  // Global typings should make req.user available.
  // If using AuthenticatedRequest, ensure it's imported or defined.
  const authenticatedRequest = req as AuthenticatedRequest; // Type assertion if not using AuthenticatedRequest directly in signature

  if (!authenticatedRequest.user || typeof authenticatedRequest.user.userId === 'undefined') {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authentication details not found.' });
  }
  
  const userId = authenticatedRequest.user.userId;

  try {
    const user = await UserModel.getUserById(userId);

    if (!user || user.deleted_at) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
    }

    // Exclude sensitive information
    const userResponse = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    return res.status(StatusCodes.OK).json(userResponse);
  } catch (error: any) {
    console.error('Error in getUserProfile:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { body } = await loginUserSchema.parseAsync(req); // Validates req.body

    const user = await UserModel.getUserByEmail(body.email);

    if (!user || user.deleted_at) { // Check for soft deletion as well
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await Password.verify(body.password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      env.jwt_secret as string,
      { expiresIn: env.expiresIn }
    );

    // Exclude password_hash from the returned user object
    const userResponse = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    return res.status(StatusCodes.OK).json({ user: userResponse, token });
  } catch (error: any) {
    if (error.errors) { // Zod validation error
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Validation failed", errors: error.errors });
    }
    console.error('Error in loginUser:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};
