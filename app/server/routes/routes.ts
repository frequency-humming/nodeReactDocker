import express from 'express';
import { eventData, kafkaData, athena} from '../controllers/controller.js';

const router = express.Router();

router.get('/', eventData);
router.get('/logs', kafkaData);
router.post('/athena', athena);

export default router;