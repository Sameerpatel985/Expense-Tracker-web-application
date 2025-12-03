"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useToast } from "@/components/ui/ToastContext";
import Image from "next/image";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');

  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setProfileData({
          name: userData.name || "",
          phone: userData.phone || "",
        });
      }
    } catch (_error) {
      console.error("Error fetching profile");
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load profile data'
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Fetch user profile
  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session, fetchProfile]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);

        // Update session with new name if it changed
        if (profileData.name !== user?.name) {
          await update({ name: profileData.name });
        }

        addToast({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile information has been saved successfully.'
        });
      } else {
        const error = await response.json();
        addToast({
          type: 'error',
          title: 'Update Failed',
          message: error.error || 'Failed to update profile'
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      addToast({
        type: 'error',
        title: 'Connection Error',
        message: 'An error occurred while updating your profile'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.currentPassword.trim()) {
      addToast({
        type: 'error',
        title: 'Current Password Required',
        message: 'Please enter your current password'
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast({
        type: 'error',
        title: 'Password Mismatch',
        message: 'New password and confirmation do not match'
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      addToast({
        type: 'error',
        title: 'Invalid Password',
        message: 'New password must be at least 6 characters long'
      });
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      addToast({
        type: 'warning',
        title: 'Same Password',
        message: 'Your new password is the same as your current password. Change cancelled.'
      });

      // Reset form
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setShowPasswordForm(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        addToast({
          type: 'success',
          title: 'Password Changed',
          message: 'Your password has been updated successfully.'
        });
      } else {
        const error = await response.json();
        addToast({
          type: 'error',
          title: 'Password Change Failed',
          message: error.error || 'Failed to change password'
        });
      }
    } catch (_error) {
      console.error("Error changing password");
      addToast({
        type: 'error',
        title: 'Connection Error',
        message: 'An error occurred while changing your password'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        await update({ image: data.imageUrl });
        // Refresh profile data to include the new image
        await fetchProfile();
        addToast({
          type: 'success',
          title: 'Avatar Updated',
          message: 'Your profile picture has been updated successfully.'
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload avatar. Please try again.'
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        addToast({
          type: 'error',
          title: 'File Too Large',
          message: 'Please select an image smaller than 5MB.'
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        addToast({
          type: 'error',
          title: 'Invalid File Type',
          message: 'Please select a valid image file.'
        });
        return;
      }

      handleAvatarUpload(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const exportData = async () => {
    try {
      const response = await fetch('/api/user/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      addToast({
        type: 'success',
        title: 'Data Exported',
        message: 'Your data has been downloaded successfully.'
      });
    } catch (_error) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export your data.'
      });
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {session?.user && (
          <DashboardHeader user={session.user as User} />
        )}
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user as User} />

      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your account settings and preferences.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'profile', label: 'Profile', icon: '👤' },
                { id: 'security', label: 'Security', icon: '🔒' },
                { id: 'preferences', label: 'Preferences', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                      {(user?.image || session?.user?.image) ? (
                        <Image
                          src={user?.image || session?.user?.image || ''}
                          alt="Profile"
                          width={96}
                          height={96}
                          className="rounded-full"
                        />
                      ) : (
                        <span className="text-2xl">👤</span>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700"
                      title="Upload new avatar"
                    >
                      📷
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Profile Picture</h3>
                    <p className="text-sm text-gray-500">
                      Upload a new profile picture. JPG, PNG or GIF up to 5MB.
                    </p>
                  </div>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleProfileSave} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={profileData.name}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={user?.email || ""}
                          disabled
                          className="bg-gray-50 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border text-gray-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number (Optional)
                    </label>
                    <div className="mt-1 max-w-md">
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Used for SMS budget notifications. Enter with country code (e.g., +1).
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </div>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>

                {/* Account Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Password & Security</h3>

                  {!showPasswordForm ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 px-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Change Password</p>
                          <p className="text-sm text-gray-500">Update your password regularly for security</p>
                        </div>
                        <button
                          onClick={() => setShowPasswordForm(true)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Change Password
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Current Password</label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordInputChange}
                          name="currentPassword"
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={handlePasswordInputChange}
                          name="newPassword"
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordInputChange}
                          name="confirmPassword"
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          {saving ? 'Updating...' : 'Update Password'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          }}
                          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>

                  {/* Data Export */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-2">Data Export</h4>
                    <p className="text-sm text-gray-500 mb-3">
                      Download a copy of all your expense data in JSON format.
                    </p>
                    <button
                      onClick={exportData}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <span className="mr-2">📁</span>
                      Download Data
                    </button>
                  </div>

                  {/* Account Deletion */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium mb-2 text-red-600">Danger Zone</h4>
                    <p className="text-sm text-gray-500 mb-3">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                          // Handle account deletion
                          addToast({
                            type: 'info',
                            title: 'Account Deletion',
                            message: 'Account deletion feature coming soon. Please contact support.'
                          });
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                    >
                      <span className="mr-2">🗑️</span>
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
