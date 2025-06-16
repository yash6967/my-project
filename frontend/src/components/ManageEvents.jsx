import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Media } from 'docx';
import { saveAs } from 'file-saver';
import './ManageEvents.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/';

const ManageEvents = () => {
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editEvent, setEditEvent] = useState(null);
  const [infoModal, setInfoModal] = useState({ isOpen: false, registrations: [] });
  const navigate = useNavigate();

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
    try {
      const response = await fetch(`${BACKEND_URL}api/events/${eventId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        alert('Event deleted successfully');
        fetchEvents();
      } else {
        console.error('Error deleting event:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleEdit = (event) => {
    setEditEvent(event);
  };

  // const handleEditSubmit = async (e) => {
  //   e.preventDefault();

  //   // const formDataToSend = new FormData();
  //   // Object.entries(editEvent).forEach(([key, value]) => {
  //   //   if (value) {
  //   //     formDataToSend.append(key, value);
  //   //   }
  //   // });
  //   const allowedFields = [
  //     'title',
  //     'description',
  //     'date',
  //     'time',
  //     'endTime',
  //     'location',
  //     'category',
  //     'organizer',
  //     'availableSeats'
  //   ];
    
  //   allowedFields.forEach(field => {
  //     if (editEvent[field] !== undefined && editEvent[field] !== null) {
  //       formDataToSend.append(field, editEvent[field]);
  //     }
  //   });
    
  //   if (editEvent.photo || editEvent.image) {
  //     formDataToSend.append('image', editEvent.photo || editEvent.image);
  //   }
    
  //   try {
  //     const response = await fetch(`${BACKEND_URL}api/events/${editEvent._id}`, {
  //       method: 'PUT',
  //       body: formDataToSend,
  //     });

  //     if (response.ok) {
  //       alert('Event updated successfully!');
  //       setEditEvent(null);
  //       fetchEvents(); // Refresh the events list
  //     } else {
  //       const errorText = await response.text();
  //       console.error('Error updating event:', errorText);
  //       alert(`Error: ${errorText}`);
  //     }
  //   } catch (error) {
  //     console.error('Error updating event:', error);
  //   }
  // };
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
      'category',
      'organizer',
      'availableSeats'
    ];
  
    allowedFields.forEach((field) => {
      if (editEvent[field] !== undefined && editEvent[field] !== null) {
        formDataToSend.append(field, editEvent[field]);
      }
    });
  
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

  const closeInfoModal = () => {
    setInfoModal({ isOpen: false, registrations: [] });
  };


   // Helper to fetch registrations for a given event
  const fetchRegistrationsForReport = async (eventId) => {
    try {
      const response = await fetch(`${BACKEND_URL}api/events/${eventId}/registrations`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
    return [];
  };

  // Helper to fetch image as base64
  const fetchImageAsBase64 = async (imageUrl) => {
    if (!imageUrl) return null;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  };

  const handleDownloadReport = async (event, type = 'pdf') => {
    const registrations = await fetchRegistrationsForReport(event._id);
    const imageBase64 = await fetchImageAsBase64(event.image);

    if (type === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(event.title, 14, 20);
      doc.setFontSize(12);
      let y = 30;
      if (imageBase64) {
        doc.addImage(imageBase64, 'JPEG', 14, y, 60, 40);
        y += 50;
      }
      doc.text(`Description: ${event.description}`, 14, y);
      y += 10;
      doc.text(`Date: ${new Date(event.date).toLocaleDateString()}`, 14, y);
      y += 10;
      doc.text(`Time: ${event.time} - ${event.endTime}`, 14, y);
      y += 10;
      doc.text(`Location: ${event.location}`, 14, y);
      y += 10;
      doc.text(`Category: ${event.category}`, 14, y);
      y += 10;
      doc.text(`Organizer: ${event.organizer}`, 14, y);
      y += 10;
      doc.text(`Available Seats: ${event.availableSeats}`, 14, y);
      y += 14;
      doc.setFontSize(14);
      doc.text('Registrations:', 14, y);
      y += 6;
      autoTable(doc, {
        startY: y,
        head: [['Name', 'Email', 'Phone Number']],
        body: registrations.map(r => [r.name, r.email, r.phoneNumber]),
      });
      doc.save(`${event.title}_report.pdf`);
    } else if (type === 'word') {
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
        new Paragraph(`Category: ${event.category}`),
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
    }
  };

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
            {event.image && <img src={`${event.image}`} alt="Event" className="event-image" />}
            {console.log(`${event.image}`)}
            <h3>{event.title}</h3>
            <p><strong>Description:</strong> {event.description}</p>
            <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {event.time} - {event.endTime}</p>
            <p><strong>Location:</strong> {event.location}</p>
            <p><strong>Category:</strong> {event.category}</p>
            <p><strong>Organizer:</strong> {event.organizer}</p>
            <p><strong>Available Seats:</strong> {event.availableSeats}</p>
            <div className="event-actions">
              <button onClick={() => handleEdit(event)}>Edit</button>
              <button onClick={() => fetchEventRegistrations(event._id)}>Info</button>
              <button onClick={() => handleDownloadReport(event, 'pdf')}>Download PDF Report</button>
               <button onClick={() => {
                if (window.confirm('Are you sure you want to delete this event?')) {
                  handleDelete(event._id);
                }
              }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
};

export default ManageEvents;
