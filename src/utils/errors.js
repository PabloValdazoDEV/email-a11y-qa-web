export function getErrorMessage(error, fallback = "No se pudo completar la solicitud") {
  return error?.response?.data?.message || fallback;
}
