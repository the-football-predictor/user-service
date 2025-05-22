import { Router } from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfile, deleteUserProfile } from '../controllers/user.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const userRouter = Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/me', authenticateJWT, getUserProfile);
userRouter.put('/me', authenticateJWT, updateUserProfile);
userRouter.delete('/me', authenticateJWT, deleteUserProfile);

export default userRouter;
