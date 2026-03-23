import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Filter, MoreHorizontal, Mail, Phone, X, Edit, Trash2, Upload, Settings } from 'lucide-react';
import Papa from 'papaparse';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  lifecycle_stage: string;
  lead_score: number;
  custom_fields?: Record<string, any>;
}

interface CustomFieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date';
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
  
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  // Data state
  const [customFieldsDef, setCustomFieldsDef] = useState<CustomFieldDef[]>([]);
  const [newFieldDef, setNewFieldDef] = useState<CustomFieldDef>({ key: '', label: '', type: 'text' });
  
  const [newContact, setNewContact] = useState<{
    first_name: string; last_name: string; email: string; phone: string; company: string; lifecycle_stage: string; lead_score: number; custom_fields: Record<string, any>;
  }>({
    first_name: '', last_name: '', email: '', phone: '', company: '', lifecycle_stage: 'lead', lead_score: 0, custom_fields: {}
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchContacts();
    // Load custom fields definitions from local storage or database (for now simulating with local state/storage)
    const savedFields = localStorage.getItem('nexus_custom_fields');
    if (savedFields) {
      try {
        setCustomFieldsDef(JSON.parse(savedFields));
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredContacts(contacts);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredContacts(contacts.filter(c => 
        c.first_name.toLowerCase().includes(lowerQuery) ||
        c.last_name.toLowerCase().includes(lowerQuery) ||
        (c.email && c.email.toLowerCase().includes(lowerQuery)) ||
        (c.company && c.company.toLowerCase().includes(lowerQuery))
      ));
    }
  }, [searchQuery, contacts]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
      setFilteredContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContactId) {
        const { error } = await supabase.from('contacts').update(newContact).eq('id', editingContactId);
        if (error) throw error;
        const updatedContacts = contacts.map(c => c.id === editingContactId ? { ...c, ...newContact } as Contact : c);
        setContacts(updatedContacts);
      } else {
        const { data, error } = await supabase.from('contacts').insert([newContact]).select();
        if (error) throw error;
        if (data) {
          setContacts([data[0], ...contacts]);
        }
      }
      setIsModalOpen(false);
      setEditingContactId(null);
      setNewContact({ first_name: '', last_name: '', email: '', phone: '', company: '', lifecycle_stage: 'lead', lead_score: 0, custom_fields: {} });
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Failed to save contact');
    }
  };

  const openEditModal = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewContact({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      lifecycle_stage: contact.lifecycle_stage,
      lead_score: contact.lead_score,
      custom_fields: contact.custom_fields || {}
    });
    setEditingContactId(contact.id);
    setIsModalOpen(true);
  };

  const handleDeleteContact = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
      setContacts(contacts.filter(c => c.id !== id));
      if (selectedContact?.id === id) setIsDetailModalOpen(false);
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Failed to delete contact');
    }
  };

  const openDetailModal = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDetailModalOpen(true);
  };

  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldDef.label || !newFieldDef.key) return;
    
    // Ensure key is unique and formatted
    const formattedKey = newFieldDef.key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    
    if (customFieldsDef.some(f => f.key === formattedKey)) {
      alert('A field with this key already exists');
      return;
    }

    const updatedFields = [...customFieldsDef, { ...newFieldDef, key: formattedKey }];
    setCustomFieldsDef(updatedFields);
    localStorage.setItem('nexus_custom_fields', JSON.stringify(updatedFields));
    setNewFieldDef({ key: '', label: '', type: 'text' });
  };

  const removeCustomField = (keyToRemove: string) => {
    if (!confirm('Remove this custom field definition? (Existing contact data will be preserved in DB but hidden)')) return;
    const updated = customFieldsDef.filter(f => f.key !== keyToRemove);
    setCustomFieldsDef(updated);
    localStorage.setItem('nexus_custom_fields', JSON.stringify(updated));
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'lead': return 'bg-blue-100 text-blue-800';
      case 'prospect': return 'bg-amber-100 text-amber-800';
      case 'customer': return 'bg-emerald-100 text-emerald-800';
      case 'churned': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const downloadCSVTemplate = () => {
    // Dynamically generate headers based on standard + custom fields
    const standardHeaders = ['first_name', 'last_name', 'email', 'phone', 'company', 'lifecycle_stage', 'lead_score'];
    const customHeaders = customFieldsDef.map(f => `cf_${f.key}`);
    
    const headers = [...standardHeaders, ...customHeaders].join(',');
    
    // Create a dummy row
    const dummyStandard = ['John', 'Doe', 'john@example.com', '+1234567890', 'Example Corp', 'lead', '50'];
    const dummyCustom = customFieldsDef.map(f => f.type === 'number' ? '100' : f.type === 'date' ? '2026-01-01' : 'Sample Text');
    
    const dummyRow = [...dummyStandard, ...dummyCustom].join(',');
    const csvContent = `${headers}\n${dummyRow}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "nexus_crm_contacts_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedData = results.data as any[];
        
        const contactsToInsert = parsedData.map(row => {
          // Extract custom fields (any column starting with cf_)
          const custom_fields: Record<string, any> = {};
          Object.keys(row).forEach(key => {
            if (key.startsWith('cf_')) {
              const actualKey = key.substring(3);
              custom_fields[actualKey] = row[key];
            }
          });

          return {
            first_name: row.first_name || '',
            last_name: row.last_name || '',
            email: row.email || null,
            phone: row.phone || null,
            company: row.company || null,
            lifecycle_stage: row.lifecycle_stage || 'lead',
            lead_score: parseInt(row.lead_score) || 0,
            custom_fields
          };
        }).filter(c => c.first_name && c.last_name); // Basic validation

        if (contactsToInsert.length === 0) {
          alert('No valid contacts found in CSV. Please check the format.');
          return;
        }

        try {
          const { data, error } = await supabase.from('contacts').insert(contactsToInsert).select();
          if (error) throw error;
          if (data) {
            setContacts(prev => [...data, ...prev]);
            alert(`Successfully imported ${data.length} contacts!`);
          }
        } catch (error) {
          console.error('Error importing contacts:', error);
          alert('Failed to import contacts. Please ensure emails/phones are unique.');
        }
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Contacts</h1>
        <div className="flex space-x-3">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => setIsCustomFieldModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            <Settings className="-ml-0.5 mr-2 h-4 w-4" />
            Manage Fields
          </button>
          <button 
            onClick={downloadCSVTemplate}
            className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            Download Template
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            <Upload className="-ml-0.5 mr-2 h-4 w-4" />
            Import CSV
          </button>
          <button 
            onClick={() => {
              setEditingContactId(null);
              setNewContact({ first_name: '', last_name: '', email: '', phone: '', company: '', lifecycle_stage: 'lead', lead_score: 0, custom_fields: {} });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            <Plus className="-ml-0.5 mr-2 h-4 w-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Custom Fields Management Modal */}
      {isCustomFieldModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl relative max-h-[90vh] flex flex-col">
            <button onClick={() => setIsCustomFieldModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold mb-2">Manage Custom Fields</h2>
            <p className="text-sm text-slate-500 mb-6">Add dynamic fields to capture specific lead data for your campaigns.</p>
            
            <form onSubmit={handleAddCustomField} className="flex gap-2 mb-6 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">Field Label (e.g. "Secondary Phone")</label>
                <input required type="text" value={newFieldDef.label} onChange={e => setNewFieldDef({...newFieldDef, label: e.target.value, key: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_')})} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
                <select value={newFieldDef.type} onChange={e => setNewFieldDef({...newFieldDef, type: e.target.value as any})} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border">
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
              </div>
              <button type="submit" className="px-3 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 text-sm font-medium h-[38px]">
                Add
              </button>
            </form>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-md">
              {customFieldsDef.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No custom fields defined yet.</div>
              ) : (
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Label</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Database Key</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Type</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {customFieldsDef.map(f => (
                      <tr key={f.key}>
                        <td className="px-4 py-2 text-sm text-slate-900">{f.label}</td>
                        <td className="px-4 py-2 text-xs text-slate-500 font-mono">cf_{f.key}</td>
                        <td className="px-4 py-2 text-sm text-slate-500 capitalize">{f.type}</td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => removeCustomField(f.key)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button onClick={() => setIsCustomFieldModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative max-h-[90vh] flex flex-col">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold mb-4">{editingContactId ? 'Edit Contact' : 'Add New Contact'}</h2>
            
            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
              <form id="contact-form" onSubmit={handleAddContact} className="space-y-4">
                {/* Standard Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">First Name</label>
                    <input required type="text" value={newContact.first_name} onChange={e => setNewContact({...newContact, first_name: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Last Name</label>
                    <input required type="text" value={newContact.last_name} onChange={e => setNewContact({...newContact, last_name: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input type="email" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Phone</label>
                  <input type="tel" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Company</label>
                  <input type="text" value={newContact.company} onChange={e => setNewContact({...newContact, company: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Stage</label>
                    <select value={newContact.lifecycle_stage} onChange={e => setNewContact({...newContact, lifecycle_stage: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border">
                      <option value="lead">Lead</option>
                      <option value="prospect">Prospect</option>
                      <option value="customer">Customer</option>
                      <option value="churned">Churned</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Lead Score (0-100)</label>
                    <input type="number" min="0" max="100" value={newContact.lead_score} onChange={e => setNewContact({...newContact, lead_score: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                  </div>
                </div>

                {/* Dynamic Custom Fields */}
                {customFieldsDef.length > 0 && (
                  <div className="pt-4 mt-4 border-t border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Custom Details</h3>
                    <div className="space-y-4">
                      {customFieldsDef.map(field => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-slate-700">{field.label}</label>
                          <input 
                            type={field.type} 
                            value={newContact.custom_fields[field.key] || ''} 
                            onChange={e => setNewContact({
                              ...newContact, 
                              custom_fields: {
                                ...newContact.custom_fields,
                                [field.key]: e.target.value
                              }
                            })} 
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>
            
            <div className="flex justify-end pt-4 mt-4 border-t border-slate-200 bg-white">
              <button type="button" onClick={() => setIsModalOpen(false)} className="mr-3 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-md">Cancel</button>
              <button type="submit" form="contact-form" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setIsDetailModalOpen(false)}>
          <div className="bg-white rounded-xl p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
              <X className="h-6 w-6" />
            </button>
            
            <div className="flex-shrink-0">
              <div className="flex items-center mb-8">
                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-3xl font-medium shadow-inner">
                  {selectedContact.first_name?.[0] || ''}{selectedContact.last_name?.[0] || ''}
                </div>
                <div className="ml-6">
                  <h2 className="text-3xl font-bold text-slate-900">{selectedContact.first_name} {selectedContact.last_name}</h2>
                  <p className="text-lg text-slate-500 mt-1">{selectedContact.company || 'No Company'}</p>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStageColor(selectedContact.lifecycle_stage)}`}>
                      {selectedContact.lifecycle_stage}
                    </span>
                    <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">Score: {selectedContact.lead_score}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Contact Info</h3>
                    <div className="flex items-center text-slate-700">
                      <Mail className="h-5 w-5 mr-3 text-slate-400" />
                      <a href={`mailto:${selectedContact.email}`} className="hover:text-blue-600">{selectedContact.email || 'N/A'}</a>
                    </div>
                    <div className="flex items-center text-slate-700">
                      <Phone className="h-5 w-5 mr-3 text-slate-400" />
                      <a href={`tel:${selectedContact.phone}`} className="hover:text-blue-600">{selectedContact.phone || 'N/A'}</a>
                    </div>
                  </div>

                  {/* Custom Fields Display */}
                  {selectedContact.custom_fields && Object.keys(selectedContact.custom_fields).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Additional Details</h3>
                      <dl className="space-y-3">
                        {customFieldsDef.map(def => {
                          const val = selectedContact.custom_fields?.[def.key];
                          if (!val) return null;
                          return (
                            <div key={def.key}>
                              <dt className="text-xs text-slate-500 font-medium">{def.label}</dt>
                              <dd className="text-sm text-slate-900 mt-0.5">{val}</dd>
                            </div>
                          );
                        })}
                      </dl>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Actions</h3>
                  <div className="flex flex-col space-y-2">
                    <button onClick={(e) => { setIsDetailModalOpen(false); openEditModal(selectedContact, e); }} className="w-full flex items-center justify-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                      <Edit className="h-4 w-4 mr-2" /> Edit Contact
                    </button>
                    <button onClick={(e) => handleDeleteContact(selectedContact.id, e)} className="w-full flex items-center justify-center px-4 py-2 border border-red-200 rounded-md shadow-sm text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Contact
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              placeholder="Search contacts..."
            />
          </div>
          <div className="text-sm text-slate-500">
            {filteredContacts.length} total contacts
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact Info</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stage</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Score</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                    Loading contacts...
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                    No contacts found.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr 
                    key={contact.id} 
                    onClick={() => openDetailModal(contact)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                            {contact.first_name?.[0] || ''}{contact.last_name?.[0] || ''}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-slate-900">{contact.first_name} {contact.last_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 flex items-center">
                        <Mail className="mr-2 h-3.5 w-3.5 text-slate-400" />
                        {contact.email}
                      </div>
                      <div className="text-sm text-slate-500 flex items-center mt-1">
                        <Phone className="mr-2 h-3.5 w-3.5 text-slate-400" />
                        {contact.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {contact.company || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStageColor(contact.lifecycle_stage)}`}>
                        {contact.lifecycle_stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center">
                        <div className="w-16 bg-slate-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              contact.lead_score > 80 ? 'bg-emerald-500' : 
                              contact.lead_score > 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${contact.lead_score}%` }}
                          />
                        </div>
                        {contact.lead_score}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={(e) => openEditModal(contact, e)} className="text-slate-400 hover:text-blue-600 p-1">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={(e) => handleDeleteContact(contact.id, e)} className="text-slate-400 hover:text-red-600 p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
