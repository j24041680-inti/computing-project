"""Regression checks using ASGI directly, without optional HTTP test packages."""
import asyncio
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import main


async def request(path, query='', payload=None):
    messages = []

    async def receive():
        return {'type': 'http.request', 'body': json.dumps(payload).encode() if payload else b'', 'more_body': False}

    async def send(message):
        messages.append(message)

    scope = {'type': 'http', 'asgi': {'version': '3.0'}, 'http_version': '1.1',
             'method': 'POST' if payload else 'GET', 'scheme': 'http', 'path': path,
             'raw_path': path.encode(), 'query_string': query.encode(),
             'headers': [(b'content-type', b'application/json')],
             'client': ('test', 1), 'server': ('test', 80), 'root_path': ''}
    await main.app(scope, receive, send)
    status = next(m['status'] for m in messages if m['type'] == 'http.response.start')
    body = b''.join(m.get('body', b'') for m in messages if m['type'] == 'http.response.body')
    return status, json.loads(body)


class APIRegressionTests(unittest.TestCase):
    def test_invalid_lookup_returns_validation_error(self):
        for query in ('start_hour=25', 'cohort=invalid', 'event_date=2026-02-30'):
            with self.subTest(query=query):
                status, body = asyncio.run(request('/api/v1/forecast-lookup', query))
                self.assertEqual(status, 422)
                self.assertTrue(body['details'])

    def test_impossible_scheduled_date_does_not_write(self):
        payload = dict(event_title='Test event', school_name='Test school',
                       district='Petaling Jaya', event_date='2026-02-30', start_hour=8)
        with patch.object(main, 'save_scheduled_events') as save:
            status, _ = asyncio.run(request('/api/v1/events', payload=payload))
            self.assertEqual(status, 422)
            save.assert_not_called()

    def test_comparison_uses_selected_month(self):
        for month in (1, 7):
            result = main.compare_districts_air_quality('Petaling Jaya', 'Shah Alam', month, 8, 'general')
            expected = main.compute_event_assessment(main.EventAssessmentRequest(month=month))
            self.assertEqual(result['district_a']['predicted_api'], expected['prediction']['predicted_api'])

    def test_separate_prediction_runs_model_and_preserves_dataset(self):
        payload = dict(district='Petaling Jaya', event_date='2026-07-15',
                       start_hour=8, duration_hours=2)
        before = main.compute_event_assessment(main.EventAssessmentRequest(**payload))
        with patch.object(main.REGRESSOR, 'predict', wraps=main.REGRESSOR.predict) as predict:
            status, body = asyncio.run(request('/api/v1/model-prediction', payload=payload))
            self.assertEqual(status, 200)
            predict.assert_called_once()
            features = predict.call_args.args[0]
            self.assertEqual(features['hour'].tolist(), [8, 9])
            self.assertTrue((features['month'] == 7).all())
        after = main.compute_event_assessment(main.EventAssessmentRequest(**payload))
        self.assertEqual(before, after)
        self.assertEqual(body['dataset_api'], before['prediction']['predicted_api'])
        self.assertAlmostEqual(body['predicted_api'], body['dataset_api'], delta=0.2)
        with patch.object(main, 'REGRESSOR', None):
            status, _ = asyncio.run(request('/api/v1/model-prediction', payload=payload))
            self.assertEqual(status, 503)
            self.assertEqual(before, main.compute_event_assessment(main.EventAssessmentRequest(**payload)))

    def test_live_inference_and_unavailable_model(self):
        payload = dict(district='Petaling Jaya', event_date='2026-07-15',
                       weather_regime='custom_override', override_api=80)
        status, body = asyncio.run(request('/api/v1/assess-event', payload=payload))
        self.assertEqual(status, 200)
        self.assertTrue(body['shap_attributions'])
        with patch.object(main, 'REGRESSOR', None):
            status, body = asyncio.run(request('/api/v1/assess-event', payload=payload))
            self.assertEqual(status, 503)
            self.assertNotIn('confidence_pct', body)


if __name__ == '__main__':
    unittest.main()
