import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Media } from 'docx';
import { saveAs } from 'file-saver';
import './ManageEvents.css';
import elonMuskImage from '../people/elon musk.png';
import fallBackImage from '../images/Image-not-found.png';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/';

const ManageEvents = () => {
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editEvent, setEditEvent] = useState(null);
  const [infoModal, setInfoModal] = useState({ isOpen: false, registrations: [] });
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [showExpertModal, setShowExpertModal] = useState(false);
  const navigate = useNavigate();

  // Available categories
  const availableCategories = [
    { value: 'ip_consultancy', label: 'IP Consultancy' },
    { value: 'company_registration', label: 'Company Registration' },
    { value: 'mentoring', label: 'Mentoring' },
    { value: 'expert_guidance', label: 'Expert Guidance' }
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}api/events`);
      const data = await response.json();
      console.log('Fetched events:', data); // Debugging log
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) {
      fetchEvents();
      return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}api/events?title=${searchQuery}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        alert('Event not found');
      }
    } catch (error) {
      console.error('Error searching for event:', error);
    }
  };
  
  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const response = await fetch(`${BACKEND_URL}api/events/${eventId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          alert('Event deleted successfully!');
          fetchEvents(); // Refresh the events list
        } else {
          alert('Error deleting event');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event');
      }
    }
  };

  const handleEdit = (event) => {
    // Ensure category is always an array for editing
    const eventToEdit = {
      ...event,
      category: Array.isArray(event.category) ? event.category : [event.category]
    };
    setEditEvent(eventToEdit);
  };

  const handleCategoryChange = (categoryValue) => {
    setEditEvent((prev) => {
      const currentCategories = prev.category || [];
      const updatedCategories = currentCategories.includes(categoryValue)
        ? currentCategories.filter(cat => cat !== categoryValue)
        : [...currentCategories, categoryValue];
      
      return { ...prev, category: updatedCategories };
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
  
    const formDataToSend = new FormData(); // ✅ Declare it first
  
    // ✅ Only include safe editable fields
    const allowedFields = [
      'title',
      'description',
      'date',
      'time',
      'endTime',
      'location',
      'organizer',
      'availableSeats'
    ];
  
    allowedFields.forEach((field) => {
      if (editEvent[field] !== undefined && editEvent[field] !== null) {
        formDataToSend.append(field, editEvent[field]);
      }
    });

    // Handle categories separately
    if (editEvent.category && Array.isArray(editEvent.category)) {
      editEvent.category.forEach(cat => formDataToSend.append('category', cat));
    }
  
    // ✅ Add image if selected
    if (editEvent.photo || editEvent.image instanceof File) {
      formDataToSend.append('image', editEvent.photo || editEvent.image);
    }
  
    try {
      const response = await fetch(`${BACKEND_URL}api/events/${editEvent._id}`, {
        method: 'PUT',
        body: formDataToSend,
      });
  
      if (response.ok) {
        alert('Event updated successfully!');
        setEditEvent(null);
        fetchEvents(); // Refresh the events list
      } else {
        const errorText = await response.text();
        console.error('Error updating event:', errorText);
        alert(`Error: ${errorText}`);
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };
  
  const handleCreate = () => {
    navigate('/create-event');
  };

  const fetchEventRegistrations = async (eventId) => {
    try {
      const response = await fetch(`${BACKEND_URL}api/events/${eventId}/registrations`);
      if (response.ok) {
        const data = await response.json();
        setInfoModal({ isOpen: true, registrations: data });
      } else {
        console.error('Error fetching registrations:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const handleViewExpert = (expert) => {
    setSelectedExpert(expert);
    setShowExpertModal(true);
  };

  const formatCategoryName = (category) => {
    if (Array.isArray(category)) {
      return category.map(cat => {
        const categoryMap = {
          'ip_consultancy': 'IP Consultancy',
          'company_registration': 'Company Registration',
          'mentoring': 'Mentoring',
          'expert_guidance': 'Expert Guidance'
        };
        return categoryMap[cat] || cat;
      }).join(', ');
    } else {
      const categoryMap = {
        'ip_consultancy': 'IP Consultancy',
        'company_registration': 'Company Registration',
        'mentoring': 'Mentoring',
        'expert_guidance': 'Expert Guidance'
      };
      return categoryMap[category] || category;
    }
  };

  const exportToPDF = async (event, registrations) => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(event.title, 20, 20);
    
    // Add event details
    doc.setFontSize(12);
    doc.text(`Description: ${event.description}`, 20, 40);
    doc.text(`Date: ${new Date(event.date).toLocaleDateString()}`, 20, 50);
    doc.text(`Time: ${event.time} - ${event.endTime}`, 20, 60);
    doc.text(`Location: ${event.location}`, 20, 70);
    doc.text(`Category: ${formatCategoryName(event.category)}`, 20, 80);
    doc.text(`Organizer: ${event.organizer}`, 20, 90);
    doc.text(`Available Seats: ${event.availableSeats}`, 20, 100);
    
    // Add registrations table
    if (registrations && registrations.length > 0) {
      doc.text('Registrations:', 20, 120);
      const tableData = registrations.map(r => [r.name, r.email, r.phoneNumber || 'N/A']);
      autoTable(doc, {
        head: [['Name', 'Email', 'Phone Number']],
        body: tableData,
        startY: 130,
      });
    }
    
    doc.save(`${event.title}_report.pdf`);
  };

  const exportToWord = async (event, registrations) => {
    // Convert image to base64 if it exists
    let imageBase64 = null;
    if (event.image) {
      try {
        const response = await fetch(event.image);
        const blob = await response.blob();
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error converting image:', error);
      }
    }

    const doc = new Document();
    const children = [
      new Paragraph({
        children: [new TextRun({ text: event.title, bold: true, size: 32 })],
      }),
      new Paragraph(''),
      new Paragraph(`Description: ${event.description}`),
      new Paragraph(`Date: ${new Date(event.date).toLocaleDateString()}`),
      new Paragraph(`Time: ${event.time} - ${event.endTime}`),
      new Paragraph(`Location: ${event.location}`),
      new Paragraph(`Category: ${formatCategoryName(event.category)}`),
      new Paragraph(`Organizer: ${event.organizer}`),
      new Paragraph(`Available Seats: ${event.availableSeats}`),
      new Paragraph(''),
      new Paragraph({ text: 'Registrations:', bold: true }),
      new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Name')] }),
              new TableCell({ children: [new Paragraph('Email')] }),
              new TableCell({ children: [new Paragraph('Phone Number')] }),
            ],
          }),
          ...registrations.map(r => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(r.name)] }),
              new TableCell({ children: [new Paragraph(r.email)] }),
              new TableCell({ children: [new Paragraph(r.phoneNumber)] }),
            ],
          })),
        ],
      }),
    ];
    if (imageBase64) {
      const imageData = imageBase64.split(',')[1];
      const image = Media.addImage(doc, Buffer.from(imageData, 'base64'), 300, 200);
      children.splice(1, 0, image);
    }
    doc.addSection({ children });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${event.title}_report.docx`);
  };

  const closeInfoModal = () => setInfoModal({ isOpen: false, registrations: [] });

  return (
    <div className="manage-events-container">
      <h2>Manage Events</h2>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by Title"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>
      <button className="create-event-button" onClick={handleCreate}>Create Event</button>
      <div className="events-list">
        {events.map((event) => (
          <div key={event._id} className="event-card">
            <img
              src={event.image ? `${event.image}` : `${fallBackImage}`}
              alt="evenet"
              className="event-image"
            />
            {console.log(`${event.image}`)}
            <h3>{event.title}</h3>
            <p><strong>Description:</strong> {event.description}</p>
            <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {event.time} - {event.endTime}</p>
            <p><strong>Location:</strong> {event.location}</p>
            <p><strong>Category:</strong> {formatCategoryName(event.category)}</p>
            <p><strong>Organizer:</strong> {event.organizer}</p>
            <p><strong>Available Seats:</strong> {event.availableSeats}</p>
            <div className="event-actions">
              <button onClick={() => handleEdit(event)}>Edit</button>
              <button onClick={() => fetchEventRegistrations(event._id)}>View Registrations</button>
              <button onClick={() => handleDelete(event._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Registration Info Modal */}
      <Modal
        isOpen={infoModal.isOpen}
        onRequestClose={closeInfoModal}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="modal-header">
          <h3>Event Registrations</h3>
          <button onClick={closeInfoModal}>×</button>
        </div>
        <div className="modal-body">
          {infoModal.registrations.length > 0 ? (
            <div>
              <div className="export-buttons">
                <button onClick={() => exportToPDF(events.find(e => e._id === infoModal.eventId), infoModal.registrations)}>
                  Export to PDF
                </button>
                <button onClick={() => exportToWord(events.find(e => e._id === infoModal.eventId), infoModal.registrations)}>
                  Export to Word
                </button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone Number</th>
                  </tr>
                </thead>
                <tbody>
                  {infoModal.registrations.map((registration, index) => (
                    <tr key={index}>
                      <td>{registration.name}</td>
                      <td>{registration.email}</td>
                      <td>{registration.phoneNumber || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No registrations found for this event.</p>
          )}
        </div>
      </Modal>

      {/* Expert Info Modal */}
      <Modal
        isOpen={showExpertModal}
        onRequestClose={() => setShowExpertModal(false)}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="modal-header">
          <h3>Expert Information</h3>
          <button onClick={() => setShowExpertModal(false)}>×</button>
        </div>
        <div className="modal-body">
          {selectedExpert && (
            <div className="expert-info">
              <img src={selectedExpert.photo || elonMuskImage} alt="Expert" className="expert-photo" />
              <h4>{selectedExpert.name}</h4>
              <p><strong>Email:</strong> {selectedExpert.email}</p>
              <p><strong>Organization:</strong> {selectedExpert.organization || 'N/A'}</p>
              <p><strong>Role:</strong> {selectedExpert.role || 'N/A'}</p>
              <p><strong>Phone:</strong> {selectedExpert.mobileNumber || 'N/A'}</p>
              {selectedExpert.linkedinProfile && (
                <p><strong>LinkedIn:</strong> <a href={selectedExpert.linkedinProfile} target="_blank" rel="noopener noreferrer">View Profile</a></p>
              )}
            </div>
          )}
        </div>
      </Modal>

      {editEvent && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <h3>Edit Event</h3>
            <form onSubmit={handleEditSubmit}>
              <label>
                Title:
                <input
                  type="text"
                  value={editEvent.title}
                  onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                  required
                />
              </label>
              <label>
                Description:
                <textarea
                  value={editEvent.description}
                  onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
                  required
                />
              </label>
              <label>
                Date:
                <input
                  type="date"
                  value={new Date(editEvent.date).toISOString().split('T')[0]}
                  onChange={(e) => setEditEvent({ ...editEvent, date: e.target.value })}
                  required
                />
              </label>
              <label>
                Time:
                <input
                  type="time"
                  value={editEvent.time}
                  onChange={(e) => setEditEvent({ ...editEvent, time: e.target.value })}
                  required
                />
              </label>
              <label>
                End Time:
                <input
                  type="time"
                  value={editEvent.endTime}
                  onChange={(e) => setEditEvent({ ...editEvent, endTime: e.target.value })}
                  required
                />
              </label>
              <label>
                Location:
                <input
                  type="text"
                  value={editEvent.location}
                  onChange={(e) => setEditEvent({ ...editEvent, location: e.target.value })}
                  required
                />
              </label>
              <label>
                Category:
                <input
                  type="text"
                  value={editEvent.category}
                  onChange={(e) => setEditEvent({ ...editEvent, category: e.target.value })}
                  required
                />
              </label>
              <label>
                Organizer:
                <input
                  type="text"
                  value={editEvent.organizer}
                  onChange={(e) => setEditEvent({ ...editEvent, organizer: e.target.value })}
                  required
                />
              </label>
              <label>
                Image (Optional):
                <input
                  type="file"
                  name="image"
                  onChange={(e) => setEditEvent({ ...editEvent, photo: e.target.files[0] })}
                />
              </label>
              <button type="submit">Save Changes</button>
              <button type="button" onClick={() => setEditEvent(null)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      <Modal
        isOpen={infoModal.isOpen}
        onRequestClose={closeInfoModal}
        contentLabel="Event Registrations"
        className="info-modal"
        overlayClassName="info-modal-overlay"
      >
        <h2>Event Registrations</h2>
        <button onClick={closeInfoModal} className="close-modal-btn">Close</button>
        <p>Total Registrations: {infoModal.registrations.length}</p>
        <table className="registrations-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone Number</th>
            </tr>
          </thead>
          <tbody>
            {infoModal.registrations.map((registration) => (
              <tr key={registration.email}>
                <td>{registration.name}</td>
                <td>{registration.email}</td>
                <td>{registration.phoneNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      <Modal
        isOpen={showExpertModal}
        onRequestClose={() => setShowExpertModal(false)}
        contentLabel="Expert Details"
        className="expert-modal"
        overlayClassName="expert-modal-overlay"
      >
        {selectedExpert && (
          <div className="expert-details-modal">
            <img
              src={selectedExpert.photo || elonMuskImage}
              alt={selectedExpert.name}
              className="expert-modal-avatar"
              style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: 16, border: '3px solid #a084e8' }}
            />
            <h2>{selectedExpert.name}</h2>
            {selectedExpert.email && <p><strong>Email:</strong> {selectedExpert.email}</p>}
            {selectedExpert.organization && <p><strong>Organization:</strong> {selectedExpert.organization}</p>}
            {selectedExpert.role && <p><strong>Role:</strong> {selectedExpert.role}</p>}
            {selectedExpert.mobileNumber && <p><strong>Mobile:</strong> {selectedExpert.mobileNumber}</p>}
            {selectedExpert.linkedinProfile && <p><strong>LinkedIn:</strong> <a href={selectedExpert.linkedinProfile} target="_blank" rel="noopener noreferrer">Profile</a></p>}
            <button onClick={() => setShowExpertModal(false)} className="close-modal-btn">Close</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageEvents;
