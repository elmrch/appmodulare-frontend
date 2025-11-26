import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { employeeService } from '../services/employeeService';
import { areaService } from '../services/areaService';
import { scheduleService } from '../services/scheduleService';
import { attendanceService } from '../services/attendanceService';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalAreas: 0,
    totalSchedules: 0,
    todayAttendances: 0
  });

  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [generalAttendance, setGeneralAttendance] = useState([]);

  useEffect(() => {
    loadDashboardData();
    
    // Auto-actualizar cada 30 segundos
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Cargar datos reales desde el backend
      const [employeesRes, areasRes, schedulesRes, attendancesRes] = await Promise.all([
        employeeService.getAll(),
        areaService.getAll(),
        scheduleService.getAll(),
        attendanceService.getAll()
      ]);

      const employees = employeesRes.data || [];
      const areas = areasRes.data || [];
      const schedules = schedulesRes.data || [];
      const attendances = attendancesRes.data || [];

      // Filtrar asistencias de hoy
      const today = new Date().toISOString().split('T')[0];
      const todayAttendances = attendances.filter(a => 
        a.date && a.date.startsWith(today)
      );

      setStats({
        totalEmployees: employees.length,
        totalAreas: areas.length,
        totalSchedules: schedules.length,
        todayAttendances: todayAttendances.length
      });

      // Procesar datos mensuales (últimos 4 meses)
      const monthlyStats = processMonthlyAttendance(attendances);
      setMonthlyData(monthlyStats);

      // Procesar asistencia general
      const generalStats = processGeneralAttendance(attendances);
      setGeneralAttendance(generalStats);

    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      alert('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyAttendance = (attendances) => {
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const monthlyMap = {};
    
    attendances.forEach(att => {
      if (!att.date) return;
      
      const date = new Date(att.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = monthNames[date.getMonth()];
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthName,
          Puntuales: 0,
          Tardes: 0,
          date: date
        };
      }
      
      // Usar el status exacto de tu modelo: "PUNTUAL" o "TARDE"
      if (att.status === 'TARDE') {
        monthlyMap[monthKey].Tardes++;
      } else if (att.status === 'PUNTUAL') {
        monthlyMap[monthKey].Puntuales++;
      }
    });

    // Obtener últimos 4 meses
    const result = Object.values(monthlyMap)
      .sort((a, b) => a.date - b.date)
      .slice(-4)
      .map(({ month, Puntuales, Tardes }) => ({ month, Puntuales, Tardes }));
    
    // Si no hay datos, retornar array vacío
    return result.length > 0 ? result : [];
  };

  const processGeneralAttendance = (attendances) => {
    let punctual = 0;
    let late = 0;

    attendances.forEach(att => {
      // Usar el status exacto de tu modelo: "PUNTUAL" o "TARDE"
      if (att.status === 'TARDE') {
        late++;
      } else if (att.status === 'PUNTUAL') {
        punctual++;
      }
    });

    const total = punctual + late;
    if (total === 0) return [];

    return [
      { 
        name: 'Puntuales', 
        value: Math.round((punctual / total) * 100), 
        color: '#17a2b8',
        count: punctual
      },
      { 
        name: 'Tardes', 
        value: Math.round((late / total) * 100), 
        color: '#6c757d',
        count: late
      }
    ];
  };

  const StatCard = ({ icon, title, value, color, bgColor }) => (
    <div className="col-md-3 mb-3">
      <div className="card shadow-sm" style={{ 
        borderTop: `4px solid ${color}`,
        height: '120px'
      }}>
        <div className="card-body d-flex flex-column justify-content-between p-3">
          <div className="d-flex justify-content-between align-items-start">
            <h6 className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>{title}</h6>
            <div style={{ 
              fontSize: '1.5rem',
              backgroundColor: bgColor,
              padding: '8px 12px',
              borderRadius: '8px'
            }}>
              {icon}
            </div>
          </div>
          <div className="d-flex align-items-end justify-content-between mt-2">
            <h2 className="mb-0" style={{ fontSize: '2rem', fontWeight: 'bold', color: color }}>
              {value}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="alert alert-info">Cargando datos del dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">📊 Dashboard</h2>
        <button 
          className="btn btn-primary" 
          onClick={loadDashboardData}
          disabled={loading}
        >
          🔄 {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="row">
        <StatCard 
          icon="👥" 
          title="Empleados" 
          value={stats.totalEmployees}
          color="#007bff"
          bgColor="#e7f3ff"
        />
        <StatCard 
          icon="🏢" 
          title="Áreas" 
          value={stats.totalAreas}
          color="#6c757d"
          bgColor="#f8f9fa"
        />
        <StatCard 
          icon="📋" 
          title="Horarios" 
          value={stats.totalSchedules}
          color="#17a2b8"
          bgColor="#e7f9fc"
        />
        <StatCard 
          icon="✅" 
          title="Asistencias" 
          value={stats.todayAttendances}
          color="#343a40"
          bgColor="#e9ecef"
        />
      </div>

      {/* Gráficos */}
      <div className="row mt-4">
        {/* Gráfico de dona - Asistencia General */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
              <span>Asistencia general</span>
              <button className="btn btn-sm btn-light">✕</button>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              {generalAttendance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={generalAttendance}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {generalAttendance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value}% (${props.payload.count} registros)`, 
                        name
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                  No hay datos de asistencia disponibles
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gráfico de barras - Asistencia Mensual */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <span>Asistencia Mensual</span>
              <button className="btn btn-sm btn-light">✕</button>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Puntuales" fill="#17a2b8" />
                    <Bar dataKey="Tardes" fill="#6c757d" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                  No hay datos mensuales disponibles
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;