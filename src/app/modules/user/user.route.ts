import express from 'express';

import { ENUM_USER_ROLE } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';

import './user.swagger';

const router = express.Router();
router.post(
  '/create-mentee',
  validateRequest(UserValidation.createMenteeZodSchema),
  // auth( ENUM_USER_ROLE.MENTEE),
  UserController.createMentee
);

router.post(
  '/create-mentor',
  // validateRequest(UserValidation.createAdminZodSchema),
  // auth( ENUM_USER_ROLE.MENTOR),
  UserController.createMentor
);

router.post(
  '/is-username-duplicate',
  // validateRequest(UserValidation.createAdminZodSchema),
  // auth( ENUM_USER_ROLE.MENTOR),
  UserController.isUsernameDuplicateController
);
router.post(
  '/create-admin',
  // validateRequest(UserValidation.createAdminZodSchema),
  // auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  UserController.createAdmin
);

router.get('/:id', UserController.getSpecificUser);

// router.post(
//   '/image-upload',
//   // validateRequest(UserValidation.createAdminZodSchema),
//   // auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
//    UserController.imageUpload
// );

export const UserRoutes = router;
