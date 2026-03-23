-- Insert mock users
INSERT INTO users (id, email, name, password_hash, role, is_active) VALUES 
('00000000-0000-0000-0000-000000000001', 'admin@nexuscrm.com', 'Admin User', 'hash', 'admin', true),
('00000000-0000-0000-0000-000000000002', 'manager@nexuscrm.com', 'Sarah Manager', 'hash', 'manager', true),
('00000000-0000-0000-0000-000000000003', 'agent1@nexuscrm.com', 'John Agent', 'hash', 'agent', true)
ON CONFLICT (email) DO NOTHING;

-- Insert mock campaigns
INSERT INTO campaigns (id, name, type, dial_mode, status, created_by) VALUES
('10000000-0000-0000-0000-000000000001', 'Q3 Outbound Sales', 'outbound', 'predictive', 'active', '00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000002', 'Customer Survey 2026', 'outbound', 'preview', 'active', '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Insert mock contacts
INSERT INTO contacts (id, first_name, last_name, email, phone, company, lifecycle_stage, lead_score, assigned_to) VALUES
('20000000-0000-0000-0000-000000000001', 'Alice', 'Smith', 'alice@techcorp.com', '+12345678901', 'Tech Corp', 'lead', 85, '00000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000002', 'Bob', 'Johnson', 'bob@innovate.io', '+12345678902', 'Innovate IO', 'prospect', 60, '00000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000003', 'Charlie', 'Davis', 'cdavis@globalnet.net', '+12345678903', 'GlobalNet', 'customer', 95, '00000000-0000-0000-0000-000000000003')
ON CONFLICT (email, phone) DO NOTHING;

-- Insert mock calls
INSERT INTO calls (id, campaign_id, contact_id, agent_id, status, direction, duration, disposition) VALUES
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'completed', 'outbound', 125, 'Interested - Follow up'),
('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'failed', 'outbound', 0, 'No Answer')
ON CONFLICT (id) DO NOTHING;
