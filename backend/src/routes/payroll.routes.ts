import { Router } from 'express';
import {
  generatePayroll,
  getUserPayrolls,
  getMyPayrolls,
  getAllPayrolls,
  getPayrollById,
  deletePayroll,
  deleteBulkPayrolls,
  markAsPaid,
  exportExcel,
  exportMyExcel,
} from '../controllers/payroll.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';
import upload from '../config/multer';

const router = Router();

// User route
router.get('/my/export/excel', authenticate, exportMyExcel);
router.get('/my', authenticate, getMyPayrolls);
router.get('/my-payrolls', authenticate, getMyPayrolls); // Fallback alias
router.get('/my-payrolls/export', authenticate, exportMyExcel); // Fallback alias

// Admin routes
router.post('/generate', authenticate, authorizeAdmin, generatePayroll);
router.post('/', authenticate, authorizeAdmin, generatePayroll); // Support both /payroll and /payroll/generate
router.get('/', authenticate, authorizeAdmin, getAllPayrolls);
router.get('/export/excel', authenticate, authorizeAdmin, exportExcel);
router.get('/user/:userId', authenticate, authorizeAdmin, getUserPayrolls);
router.get('/:id', authenticate, authorizeAdmin, getPayrollById);
router.patch('/:id/pay', authenticate, authorizeAdmin, upload.single('paymentProof'), markAsPaid);
router.delete('/bulk', authenticate, authorizeAdmin, deleteBulkPayrolls);
router.delete('/:id', authenticate, authorizeAdmin, deletePayroll);
router.delete('/', authenticate, authorizeAdmin, deleteBulkPayrolls); // Fallback for bulk DELETE /payroll with body

export default router;
