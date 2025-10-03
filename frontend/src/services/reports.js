import api from "../api";
import { ENDPOINTS, ACCESS_TOKEN } from "../constants";

/** ===== LIST / CREATE ===== */

export async function listMyReports() {
  const { data } = await api.get(ENDPOINTS.reports.mine);
  return data;
}

export async function createReport(fields) {
  const fd = new FormData();
  const { title, description, target, cwe, cvss_score, impact, poc_file } = fields;

  if (title) fd.append("title", title);
  if (description) fd.append("description", description);
  if (target) fd.append("target", target);
  if (cwe) fd.append("cwe", cwe);
  if (cvss_score !== undefined && cvss_score !== null && cvss_score !== "") {
    fd.append("cvss_score", String(cvss_score));
  }
  if (impact) fd.append("impact", impact);
  if (poc_file) fd.append("poc_file", poc_file);

  const { data } = await api.post(ENDPOINTS.reports.create, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}

/** ===== DELETE ===== */
export async function deleteReport(id) {
  const pk = Number(id);
  if (!Number.isFinite(pk)) {
    throw new Error(`Invalid report id: ${id}`);
  }

  const url = ENDPOINTS.reports.del(pk);


  const res = await api.delete(url);
  if (res.status !== 204 && res.status !== 200) {
    throw new Error(`Delete failed ${res.status}`);
  }
}
