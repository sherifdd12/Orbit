-- Project Site Console Enhancement
-- Creates tables for project milestones and team member allocation

-- Project Milestones Table
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Members / Resource Allocation Table
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(100) DEFAULT 'Team Member',
    allocation_percentage INTEGER DEFAULT 100 CHECK (allocation_percentage BETWEEN 0 AND 100),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, profile_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_profile ON project_members(profile_id);

-- Enable RLS
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_milestones
CREATE POLICY "Allow authenticated read milestones" ON project_milestones
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert milestones" ON project_milestones
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update milestones" ON project_milestones
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete milestones" ON project_milestones
    FOR DELETE TO authenticated USING (true);

-- RLS Policies for project_members
CREATE POLICY "Allow authenticated read members" ON project_members
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert members" ON project_members
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update members" ON project_members
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete members" ON project_members
    FOR DELETE TO authenticated USING (true);
