/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose, { SortOrder } from 'mongoose';

import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { User } from '../user/user.model';
import { mentorSearchableFields } from './mentor.constant';
import { IMentor, IMentorFilters } from './mentor.interface';
import { Mentor } from './mentor.model';

const getAllMentors = async (
  filters: IMentorFilters,
  paginationOptions: IPaginationOptions
): Promise<IGenericResponse<IMentor[]>> => {
  // Extract searchTerm to implement search query
  const { searchTerm, ...filtersData } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const andConditions = [];
  // Search needs $or for searching in specified fields
  if (searchTerm) {
    andConditions.push({
      $or: mentorSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }
  // Filters needs $and to fullfill all the conditions
  if (Object.keys(filtersData).length) {
    andConditions.push({
      $and: Object.entries(filtersData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  // Dynamic  Sort needs  field to  do sorting
  const sortConditions: { [key: string]: SortOrder } = {};
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder;
  }
  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};

  const result = await Mentor.find(whereConditions)
    .populate('academicSemester')
    .populate('academicDepartment')
    .populate('academicFaculty')
    .sort(sortConditions)
    .skip(skip)
    .limit(limit);

  const total = await Mentor.countDocuments(whereConditions);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getSingleMentor = async (id: string): Promise<IMentor | null> => {
  const result = await Mentor.findOne({ id })
    .populate('academicSemester')
    .populate('academicDepartment')
    .populate('academicFaculty');
  return result;
};

const updateMentor = async (
  id: string,
  payload: Partial<IMentor>
): Promise<IMentor | null> => {
  const isExist = await Mentor.findOne({ id });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Mentor not found !');
  }

  const { name, guardian, localGuardian, ...studentData } = payload;

  const updatedStudentData: Partial<IMentor> = { ...studentData };

  if (name && Object.keys(name).length > 0) {
    Object.keys(name).forEach(key => {
      const nameKey = `name.${key}` as keyof Partial<IMentor>; // `name.fisrtName`
      (updatedStudentData as any)[nameKey] = name[key as keyof typeof name];
    });
  }
  if (guardian && Object.keys(guardian).length > 0) {
    Object.keys(guardian).forEach(key => {
      const guardianKey = `guardian.${key}` as keyof Partial<IMentor>; // `guardian.fisrtguardian`
      (updatedStudentData as any)[guardianKey] =
        guardian[key as keyof typeof guardian];
    });
  }
  if (localGuardian && Object.keys(localGuardian).length > 0) {
    Object.keys(localGuardian).forEach(key => {
      const localGuradianKey =
        `localGuardian.${key}` as keyof Partial<IMentor>; // `localGuardian.fisrtName`
      (updatedStudentData as any)[localGuradianKey] =
        localGuardian[key as keyof typeof localGuardian];
    });
  }

  const result = await Mentor.findOneAndUpdate({ id }, updatedStudentData, {
    new: true,
  });
  return result;
};

const deleteMentor = async (id: string): Promise<IMentor | null> => {
  // check if the student is exist
  const isExist = await Mentor.findOne({ id });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Mentor not found !');
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    //delete student first
    const student = await Mentor.findOneAndDelete({ id }, { session });
    if (!student) {
      throw new ApiError(404, 'Failed to delete student');
    }
    //delete user
    await User.deleteOne({ id });
    session.commitTransaction();
    session.endSession();

    return student;
  } catch (error) {
    session.abortTransaction();
    throw error;
  }
};

export const MentorService = {
  getAllMentors,
  getSingleMentor,
  updateMentor,
  deleteMentor
 
};
