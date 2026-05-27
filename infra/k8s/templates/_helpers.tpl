{{- define "zynex.name" -}}
zynex
{{- end -}}

{{- define "zynex.labels" -}}
app.kubernetes.io/name: {{ include "zynex.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}
