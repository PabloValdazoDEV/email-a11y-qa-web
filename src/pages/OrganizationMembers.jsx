import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  deleteOrganizationMemberRequest,
  getOrganizationMembersRequest,
  getOrganizationsRequest,
  updateOrganizationMemberRequest,
} from "../api/organizations.js";
import { Alert } from "../components/ui/Alert.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { getErrorMessage } from "../utils/errors.js";

const ownerRoles = ["ADMIN", "EDITOR", "VIEWER"];
const adminRoles = ["EDITOR", "VIEWER"];

function canManageMember(actorRole, memberRole) {
  if (memberRole === "OWNER") return false;
  if (actorRole === "OWNER") return true;
  return actorRole === "ADMIN" && adminRoles.includes(memberRole);
}

export function OrganizationMembers() {
  const [organization, setOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingMembershipId, setPendingMembershipId] = useState(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: organizationsData } = await getOrganizationsRequest();
      const currentOrganization = organizationsData.organizations[0] ?? null;
      setOrganization(currentOrganization);

      if (!currentOrganization) {
        setMembers([]);
        return;
      }

      const { data: membersData } = await getOrganizationMembersRequest(
        currentOrganization.id,
      );
      setMembers(membersData.members);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudieron cargar los miembros"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function changeRole(member, role) {
    setPendingMembershipId(member.membershipId);
    try {
      const { data } = await updateOrganizationMemberRequest(
        organization.id,
        member.membershipId,
        { role },
      );
      setMembers((current) => current.map((item) =>
        item.membershipId === member.membershipId ? data.member : item));
      toast.success("Rol actualizado");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "No se pudo actualizar el rol"));
    } finally {
      setPendingMembershipId(null);
    }
  }

  async function removeMember(member) {
    const fullName = `${member.user.name} ${member.user.lastName}`;
    if (!window.confirm(`¿Eliminar a ${fullName} de la organización?`)) return;

    setPendingMembershipId(member.membershipId);
    try {
      await deleteOrganizationMemberRequest(organization.id, member.membershipId);
      setMembers((current) => current.filter((item) =>
        item.membershipId !== member.membershipId));
      toast.success("Miembro eliminado de la organización");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "No se pudo eliminar el miembro"));
    } finally {
      setPendingMembershipId(null);
    }
  }

  if (loading) return <Spinner label="Cargando miembros..." />;

  if (error) {
    return (
      <Alert tone="error">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Button type="button" variant="secondary" onClick={loadMembers}>
            Reintentar
          </Button>
        </div>
      </Alert>
    );
  }

  if (!organization) {
    return (
      <Alert>
        Primero debes <Link className="focus-ring rounded font-semibold underline" to="/dashboard">crear una organización</Link>.
      </Alert>
    );
  }

  const actorRole = organization.membership.role;
  const assignableRoles = actorRole === "OWNER" ? ownerRoles : adminRoles;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">
          {organization.name}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
          Miembros
        </h1>
        <p className="mt-2 text-zinc-600">
          Consulta las personas que pertenecen a tu organización y sus permisos.
        </p>
      </header>

      {members.length === 0 ? (
        <Alert>No hay miembros en esta organización.</Alert>
      ) : (
        <ul className="space-y-3" aria-label="Miembros de la organización">
          {members.map((member) => {
            const canManage = canManageMember(actorRole, member.role);
            const pending = pendingMembershipId === member.membershipId;
            const fullName = `${member.user.name} ${member.user.lastName}`;

            return (
              <li
                key={member.membershipId}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-card sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-bold text-zinc-950">{fullName}</h2>
                    <p className="break-all text-sm text-zinc-600">{member.user.email}</p>
                    <p className="mt-2 text-sm font-semibold text-indigo-800">
                      Rol: {member.role}
                    </p>
                    {member.role === "OWNER" && (
                      <p className="mt-1 text-xs text-zinc-600">Propietario protegido</p>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
                      <div>
                        <label
                          htmlFor={`member-role-${member.membershipId}`}
                          className="mb-1.5 block text-sm font-medium text-zinc-800"
                        >
                          Cambiar rol
                        </label>
                        <select
                          id={`member-role-${member.membershipId}`}
                          value={member.role}
                          onChange={(event) => changeRole(member, event.target.value)}
                          disabled={pending}
                          className="focus-ring min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 disabled:bg-zinc-100 sm:w-40"
                        >
                          {assignableRoles.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                      <Button
                        type="button"
                        variant="danger"
                        loading={pending}
                        onClick={() => removeMember(member)}
                        aria-label={`Eliminar a ${fullName} de la organización`}
                      >
                        Eliminar
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
