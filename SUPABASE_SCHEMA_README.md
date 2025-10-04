# Kulu İlan - Supabase Schema Files

This directory contains different versions of the Supabase database schema for the Kulu İlan project.

## Schema Files

### 1. SUPABASE_SCHEMA.sql
This is the main schema file that matches the current application structure. It includes:
- Core tables: listings, users_min, favorites
- Row Level Security (RLS) policies
- Indexes for performance
- Storage configuration
- Triggers

### 2. SUPABASE_SCHEMA_SIMPLE.sql
A simplified version of the schema with only the essential features:
- Core tables without additional fields
- Basic RLS policies
- Essential indexes
- Storage configuration

### 3. SUPABASE_SCHEMA_UPDATED.sql
An enhanced version of the schema with additional features:
- Extended listings table with more property details
- Additional admin_approvals table for tracking approvals
- Enhanced RLS policies
- Additional indexes
- Advanced triggers for automatic status updates

### 4. SUPABASE_SCHEMA_EXPLAINED.sql
A fully documented version of the schema with detailed comments explaining:
- Purpose of each table and field
- RLS policy explanations
- Index purposes
- Storage configuration details
- Trigger functionality

### 5. SUPABASE_STORAGE_SCHEMA.sql
A dedicated storage schema file that focuses specifically on:
- Storage bucket configuration
- Detailed RLS policies for storage
- Helper functions for image handling
- Usage examples and troubleshooting tips

## Usage

To apply any of these schemas to your Supabase project:

1. Go to your Supabase project dashboard
2. Open the SQL Editor
3. Copy and paste the contents of the desired schema file
4. Run the SQL commands

For the best experience, we recommend applying the schemas in this order:
1. First apply the main schema (SUPABASE_SCHEMA.sql)
2. Then apply the storage schema (SUPABASE_STORAGE_SCHEMA.sql) separately

## Schema Details

### Tables

#### listings
Stores property listings with the following fields:
- id: Unique identifier
- created_at: Creation timestamp
- approved_at: Approval timestamp
- status: Listing status (pending, approved, rejected)
- title: Listing title
- owner_name: Property owner's name
- owner_phone: Property owner's phone number
- neighborhood: Property neighborhood
- property_type: Type of property (Daire, Müstakil, Arsa, etc.)
- rooms: Number of rooms
- area_m2: Area in square meters
- price_tl: Price in Turkish Lira
- is_for: Sale or rental status
- description: Property description
- images: Array of image URLs

#### users_min
Stores user registration requests with the following fields:
- id: Unique identifier
- created_at: Creation timestamp
- full_name: User's full name
- phone: User's phone number (unique)
- status: User status (pending, approved, rejected)

#### favorites
Stores user favorites with the following fields:
- id: Unique identifier
- created_at: Creation timestamp
- listing_id: Reference to the listing
- user_id: Reference to the authenticated user (if logged in)
- device_id: Device identifier (for anonymous users)

#### admin_approvals (in UPDATED version)
Tracks admin approvals with the following fields:
- id: Unique identifier
- created_at: Creation timestamp
- target_type: Type of item being approved (listing, user)
- target_id: ID of the item being approved
- decision: Approval decision (pending, approved, rejected)
- decided_at: Decision timestamp
- decided_by: Admin who made the decision
- notes: Additional notes

## Security

All schemas implement Row Level Security (RLS) policies to ensure:
- Only approved listings are publicly visible
- Users can only modify their own listings
- Only admins can approve/reject listings and users
- Users can only access their own favorites

## Indexes

The schemas include indexes on frequently queried fields for better performance:
- listings.status
- listings.neighborhood
- listings.property_type
- listings.is_for
- listings.price_tl
- listings.owner_phone
- favorites.listing_id
- favorites.user_id
- favorites.device_id
- users_min.phone
- users_min.status

## Storage

The schemas configure a storage bucket for listing images:
- Bucket name: listings.images
- Public access for image viewing
- Authenticated access for image uploads
- Owner-based deletion permissions

The dedicated SUPABASE_STORAGE_SCHEMA.sql file provides:
- More detailed storage configuration
- Enhanced RLS policies specifically for storage
- Helper functions for image URL generation
- File size and MIME type restrictions
- Usage examples for frontend implementation
- Troubleshooting tips for common storage issues