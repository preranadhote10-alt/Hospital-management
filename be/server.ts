import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './firebase.js'; // Use .js extension since we are in ES Module context
import { 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  setDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  deleteDoc
} from 'firebase/firestore';

const app = express();
const PORT = 3000;

app.use(express.json());

// Mock/Initial seed data for hospitals
const initialHospitals = [
  {
    id: 'st-jude',
    name: 'St. Jude Medical Center',
    address: 'Main Wing A, Silicon Valley Campus',
    distance: '0.8 miles away',
    rating: 4.9,
    liveQueueWait: 8,
    consultationFee: 45,
    badge: 'Urgent Care Open',
    availableDocs: 12,
    description: 'Specializing in Cardiology, Neurology, and Emergency Care with 24/7 staff availability.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLCgScl5hl8sHMdtkcxRY17F8rt2QK1--wQWSvTv3F0TXaCl9aMtFvbIqjm2LsY9oaXBNdjAsAG7yXQtVAyROrmbAOL7aRdOBGuYWmpA87lQMQDtyp_3idTaVRwehb-vM5xVcUs0UrJ5Ut7xz6dHleURwmA0kImLSOvzhJdK4xoICFY2lFv2pDIfnPPyMLPouhLH5YmK3AYiooBWD7usg1DbPKruO19QXGYSQjV-6fsKTiGFkmN-96zv18lA6dfwxfO6unB2G3ijA'
  },
  {
    id: 'heritage',
    name: 'Heritage Health',
    address: 'Diagnostic Center, East Boulevard',
    distance: '2.4 miles away',
    rating: 4.7,
    liveQueueWait: 22,
    consultationFee: 30,
    badge: 'High Efficiency',
    availableDocs: 8,
    description: 'State-of-the-art diagnostics and outpatient clinic specializing in general medicine.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0Ybvwv_Zo6DXroM9gew01YQ2p3QUVtAeXoEXUWR3nBu-f_Ve6AyqmOMSGtw4YVinYtXIxB9OTJJ681kP2-dh6uzNkVEd7cSG9c8VNlOL6TIYAiVvq0Orfo3GRVPdniLCuQWzES6tQjHLB3z64naaHmuD4hMDKu6ZTSavQLx_82i9jImjHvsxputQA0cKh__xMXwYYQLRKIZJVCLxpJvcPMmccq9FNbkkSLyU_mYQc3RArcmjvWXZoad1dD0gNyFMgPfeUcqL9Ho8'
  },
  {
    id: 'pacific',
    name: 'Pacific Specialty',
    address: 'Orthopedics & Spine, Heights Road',
    distance: '5.1 miles away',
    rating: 4.5,
    liveQueueWait: 45,
    consultationFee: 60,
    badge: 'Specialty Center',
    availableDocs: 10,
    description: 'Crisp contemporary design representing a premium healthcare facility in orthopedic solutions.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_6WqAT7cLNd1WndaOrJazvRMAN6NS41tmokNPVOV980XAYl7468jDfh3swPf5hRLTJW-Q12sEHGWQIhGO3BF_oiPojOvGMq6lfyZQytNG28bT20SYGoSRVm8QEntCqivLjemYy_c-ionj8-GtcEPmJbTd1O--ZSUqWacAZqm9ruolW-qZT4qqaJ5LI_-8DC4d4HWJshTlouFW1y9HrjGvi6cvhUczrxA1oJGbZo840MRVbUJPq5JaHHR2dQe62vX4kdmQg0DzEtE'
  },
  {
    id: 'city-general',
    name: 'City General Hospital',
    address: 'Central Plaza Wing, Bayview',
    distance: '1.2 miles away',
    rating: 4.8,
    liveQueueWait: 12,
    consultationFee: 40,
    badge: 'Full Service',
    availableDocs: 15,
    description: 'Providing comprehensive inpatient and emergency services to the broader bay area.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApsI6LAd-DOe6hiq_DLG1JrlZXNgwC_DOfo03ISPSoGghZ2NYUS8sS_dM7uzv9ZQCZdMny8iyWsY4Y9GWlu27MydrMaOOGz8ZGCKAukmqhKjyG4ZkDshuZCDeLvaPSAkcPWxx8x6kH6rWUDRfMdM1q4zRxd1ImG-xZ4vodTXi1Dd3fsBx_WWsWUR_KwbMY71HYnzoElDQXhRyk2DJZk9aX2QSjcYeMd7aL8piaCiJc3a-4sOHj-W0lI2QPEU0iFkuppK1LvEvX0jI'
  }
];

// Helper function to seed initial data if collections are empty
async function seedDatabase() {
  try {
    const hospitalsCol = collection(db, 'hospitals');
    const hospitalDocs = await getDocs(hospitalsCol);
    
    if (hospitalDocs.empty) {
      console.log('Seeding initial hospitals to Firestore...');
      for (const hosp of initialHospitals) {
        await setDoc(doc(db, 'hospitals', hosp.id), hosp);
      }
    }

    const ticketsCol = collection(db, 'tickets');
    const ticketsDocs = await getDocs(ticketsCol);
    
    if (ticketsDocs.empty) {
      console.log('Seeding initial mock tickets to Firestore...');
      const initialTickets = [
        {
          id: 'ticket-1',
          token: 'A042',
          fullName: 'Elena Martinez',
          phone: '+1 (555) 019-3829',
          age: 42,
          gender: 'Female',
          symptoms: 'Chest pain / Hypertension',
          severity: 'Critical',
          status: 'Urgent', // Shown in red
          joinedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
          type: 'Walk-in',
          reason: 'Emergency / Urgent Care',
          department: 'Cardiology',
          hospitalId: 'st-jude',
          hospitalName: 'St. Jude Medical Center'
        },
        {
          id: 'ticket-2',
          token: 'B112',
          fullName: 'Johnathan Doe',
          phone: '+1 (555) 012-3456',
          age: 28,
          gender: 'Male',
          symptoms: 'General Wellness Checkup',
          severity: 'Mild',
          status: 'Called', // Currently being seen
          joinedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
          type: 'Online',
          reason: 'General Consultation',
          department: 'General',
          hospitalId: 'st-jude',
          hospitalName: 'St. Jude Medical Center'
        },
        {
          id: 'ticket-3',
          token: 'W089',
          fullName: 'Sarah Adams',
          phone: '+1 (555) 014-9876',
          age: 8,
          gender: 'Female',
          symptoms: 'Pediatric Consultation',
          severity: 'Moderate',
          status: 'Waiting',
          joinedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
          type: 'Walk-in',
          reason: 'General Consultation',
          department: 'Pediatrics',
          hospitalId: 'st-jude',
          hospitalName: 'St. Jude Medical Center'
        },
        {
          id: 'ticket-4',
          token: 'W090',
          fullName: 'Marcus Kim',
          phone: '+1 (555) 015-4321',
          age: 35,
          gender: 'Male',
          symptoms: 'Dermatology Referral',
          severity: 'Mild',
          status: 'Waiting',
          joinedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
          type: 'Walk-in',
          reason: 'General Consultation',
          department: 'Dermatology',
          hospitalId: 'st-jude',
          hospitalName: 'St. Jude Medical Center'
        }
      ];

      for (const ticket of initialTickets) {
        await setDoc(doc(db, 'tickets', ticket.id), ticket);
      }
    }
    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// REST API Routes

// 1. Get all hospitals
app.get('/api/hospitals', async (req, res) => {
  try {
    const hospitalsCol = collection(db, 'hospitals');
    const hospitalDocs = await getDocs(hospitalsCol);
    const hospitalsList = hospitalDocs.docs.map(doc => doc.data());
    res.json(hospitalsList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get all tickets
app.get('/api/tickets', async (req, res) => {
  try {
    const ticketsCol = collection(db, 'tickets');
    const ticketsDocs = await getDocs(ticketsCol);
    const ticketsList = ticketsDocs.docs.map(doc => doc.data());
    // Sort tickets: Called first, then Waiting, then completed/cancelled.
    // Also sorted by joinedAt.
    ticketsList.sort((a, b) => {
      const statusOrder: { [key: string]: number } = { 'Urgent': 1, 'Called': 2, 'Waiting': 3, 'Completed': 4, 'Cancelled': 5 };
      const orderA = statusOrder[a.status] || 3;
      const orderB = statusOrder[b.status] || 3;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });
    res.json(ticketsList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get specific ticket
app.get('/api/tickets/:id', async (req, res) => {
  try {
    const ticketDoc = await getDoc(doc(db, 'tickets', req.params.id));
    if (ticketDoc.exists()) {
      res.json(ticketDoc.data());
    } else {
      res.status(404).json({ error: 'Ticket not found' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Create new ticket
app.post('/api/tickets', async (req, res) => {
  try {
    const { 
      fullName, 
      phone, 
      age, 
      gender, 
      symptoms, 
      severity, 
      type, 
      reason, 
      department, 
      hospitalId, 
      hospitalName 
    } = req.body;

    if (!fullName || !phone || !hospitalId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Generate Token
    // Prefix based on criteria:
    // Emergency / Critical severity -> "A" (e.g. A025)
    // Online registration -> "B" (e.g. B112)
    // Walk-in registration -> "W" (e.g. W089)
    let prefix = 'W';
    if (severity === 'Critical' || reason === 'Emergency / Urgent Care') {
      prefix = 'A';
    } else if (type === 'Online') {
      prefix = 'B';
    }

    // Get sequential number based on current count
    const ticketsCol = collection(db, 'tickets');
    const ticketsDocs = await getDocs(ticketsCol);
    const existingCount = ticketsDocs.size;
    const seqNum = String(existingCount + 81).padStart(3, '0'); // offset to look realistic e.g. W089
    const token = `${prefix}${seqNum}`;

    const newTicketId = `ticket-${Date.now()}`;
    const newTicket = {
      id: newTicketId,
      token,
      fullName,
      phone,
      age: Number(age) || 30,
      gender: gender || 'Select Gender',
      symptoms: symptoms || '',
      severity: severity || 'Mild',
      status: (severity === 'Critical' || reason === 'Emergency / Urgent Care') ? 'Urgent' : 'Waiting',
      joinedAt: new Date().toISOString(),
      type: type || 'Walk-in',
      reason: reason || 'General Consultation',
      department: department || 'General',
      hospitalId,
      hospitalName: hospitalName || 'Hospital Center'
    };

    await setDoc(doc(db, 'tickets', newTicketId), newTicket);

    // Update the hospital's wait time (simulate dynamic wait time increases)
    const hospitalRef = doc(db, 'hospitals', hospitalId);
    const hospitalSnap = await getDoc(hospitalRef);
    if (hospitalSnap.exists()) {
      const currentHosp = hospitalSnap.data();
      const additionalTime = severity === 'Critical' ? 10 : 5;
      await updateDoc(hospitalRef, {
        liveQueueWait: (currentHosp.liveQueueWait || 5) + additionalTime
      });
    }

    res.status(201).json(newTicket);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Update ticket status (called, completed, cancelled, urgent)
app.patch('/api/tickets/:id', async (req, res) => {
  try {
    const { status, severity } = req.body;
    const ticketRef = doc(db, 'tickets', req.params.id);
    const ticketSnap = await getDoc(ticketRef);
    
    if (!ticketSnap.exists()) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (severity !== undefined) updates.severity = severity;

    await updateDoc(ticketRef, updates);

    // If completed or cancelled, lower the hospital's live wait time
    if (status === 'Completed' || status === 'Cancelled') {
      const ticketData = ticketSnap.data();
      const hospitalRef = doc(db, 'hospitals', ticketData.hospitalId);
      const hospitalSnap = await getDoc(hospitalRef);
      if (hospitalSnap.exists()) {
        const currentHosp = hospitalSnap.data();
        const reductionTime = ticketData.severity === 'Critical' ? 10 : 5;
        const newWait = Math.max(5, (currentHosp.liveQueueWait || 10) - reductionTime);
        await updateDoc(hospitalRef, { liveQueueWait: newWait });
      }
    }

    const updatedDoc = await getDoc(ticketRef);
    res.json(updatedDoc.data());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Delete/Reset all tickets (for convenience/testing)
app.post('/api/tickets/reset', async (req, res) => {
  try {
    const ticketsCol = collection(db, 'tickets');
    const ticketsDocs = await getDocs(ticketsCol);
    for (const d of ticketsDocs.docs) {
      await deleteDoc(doc(db, 'tickets', d.id));
    }
    // Also reset hospital wait times
    for (const hosp of initialHospitals) {
      await setDoc(doc(db, 'hospitals', hosp.id), hosp);
    }
    await seedDatabase();
    res.json({ status: 'Reset and seeded database successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Get receptionist dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const ticketsCol = collection(db, 'tickets');
    const ticketsDocs = await getDocs(ticketsCol);
    const tickets = ticketsDocs.docs.map(doc => doc.data());

    const totalToday = tickets.length + 124; // offset for realism, matching 128 from screenshot
    const onlineBookings = tickets.filter(t => t.type === 'Online').length + 81; // matching 84
    const walkins = tickets.filter(t => t.type === 'Walk-in').length + 42; // matching 44
    
    // Avg wait calculation
    let totalWait = 0;
    let counted = 0;
    tickets.forEach(t => {
      if (t.status === 'Waiting' || t.status === 'Urgent') {
        totalWait += t.severity === 'Critical' ? 10 : 15;
        counted++;
      }
    });
    const avgWaitTime = counted > 0 ? Math.round(totalWait / counted) : 18;

    res.json({
      todayTotal: totalToday,
      onlineBookings,
      walkins,
      avgWaitTime
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start express server and hook Vite in dev mode
async function start() {
  // Seed initial data
  await seedDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

start();
