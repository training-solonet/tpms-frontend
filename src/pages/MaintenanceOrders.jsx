import React, { useState } from 'react';
import { 
  WrenchScrewdriverIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { maintenanceOrders, trucks, drivers } from '../data/index.js';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';

const MaintenanceOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Filter maintenance orders
  const filteredOrders = maintenanceOrders.filter(order => {
    const statusMatch = filterStatus === 'all' || order.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || order.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  // Get order statistics
  const getOrderStats = () => {
    const total = maintenanceOrders.length;
    const pending = maintenanceOrders.filter(o => o.status === 'pending').length;
    const inProgress = maintenanceOrders.filter(o => o.status === 'in_progress').length;
    const completed = maintenanceOrders.filter(o => o.status === 'completed').length;
    const overdue = maintenanceOrders.filter(o => {
      const dueDate = new Date(o.due_date);
      const now = new Date();
      return o.status !== 'completed' && dueDate < now;
    }).length;

    return { total, pending, inProgress, completed, overdue };
  };

  const stats = getOrderStats();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <WrenchScrewdriverIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in_progress': return 'blue';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const isOverdue = (order) => {
    const dueDate = new Date(order.due_date);
    const now = new Date();
    return order.status !== 'completed' && dueDate < now;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Maintenance Orders</h1>
              <p className="text-gray-600 mt-2">Manage vehicle maintenance and work orders</p>
            </div>
            <div className="flex gap-2">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <select 
                value={filterPriority} 
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg">
                <PlusIcon className="h-5 w-5" />
                New Order
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-xl">
                <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-xl">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-xl">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-xl">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-xl">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const truck = trucks.find(t => t.id === order.truck_id);
            const assignedDriver = drivers.find(d => d.id === order.assigned_to);
            const overdue = isOverdue(order);
            
            return (
              <div
                key={order.id}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer ${
                  overdue ? 'ring-2 ring-red-200' : ''
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`bg-${getStatusColor(order.status)}-100 p-3 rounded-xl`}>
                      {getStatusIcon(order.status)}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">{order.title}</h3>
                      <p className="text-sm text-gray-600">{truck?.name || 'Unknown Truck'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getPriorityColor(order.priority)}-100 text-${getPriorityColor(order.priority)}-800`}>
                      {order.priority}
                    </span>
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{order.description}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{order.maintenance_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Due Date:</span>
                    <span className={`font-medium ${overdue ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatDate(order.due_date)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Assigned:</span>
                    <span className="font-medium">{assignedDriver?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cost:</span>
                    <span className="font-medium">${order.estimated_cost?.toLocaleString() || 'TBD'}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`w-full bg-${getStatusColor(order.status)}-50 border border-${getStatusColor(order.status)}-200 rounded-xl p-3`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium text-${getStatusColor(order.status)}-800 capitalize`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    {overdue && (
                      <span className="text-xs text-red-600 font-medium">OVERDUE</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No maintenance orders found matching your filters</p>
          </div>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedOrder.title}</h2>
                    <p className="text-gray-600">
                      {trucks.find(t => t.id === selectedOrder.truck_id)?.name} - 
                      {trucks.find(t => t.id === selectedOrder.truck_id)?.plate_number}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
                      <PencilIcon className="h-4 w-4" />
                      Edit
                    </button>
                    <button 
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-colors"
                      onClick={() => setSelectedOrder(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Order Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium capitalize text-${getStatusColor(selectedOrder.status)}-600`}>
                          {selectedOrder.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Priority:</span>
                        <span className={`font-medium capitalize text-${getPriorityColor(selectedOrder.priority)}-600`}>
                          {selectedOrder.priority}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{selectedOrder.maintenance_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{formatDate(selectedOrder.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Schedule & Cost</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Due Date:</span>
                        <span className={`font-medium ${isOverdue(selectedOrder) ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatDate(selectedOrder.due_date)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estimated Cost:</span>
                        <span className="font-medium">${selectedOrder.estimated_cost?.toLocaleString() || 'TBD'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assigned To:</span>
                        <span className="font-medium">
                          {drivers.find(d => d.id === selectedOrder.assigned_to)?.name || 'Unassigned'}
                        </span>
                      </div>
                      {selectedOrder.completed_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Completed:</span>
                          <span className="font-medium">{formatDate(selectedOrder.completed_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Description</h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700">{selectedOrder.description}</p>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Notes</h4>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-blue-700">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}

                {/* Parts Required */}
                {selectedOrder.parts_required && selectedOrder.parts_required.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Parts Required</h4>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <ul className="space-y-1">
                        {selectedOrder.parts_required.map((part, index) => (
                          <li key={index} className="text-gray-700 text-sm">• {part}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </TailwindLayout>
  );
};

export default MaintenanceOrders;
