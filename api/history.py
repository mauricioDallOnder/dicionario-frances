import requests
import os
import json

class History:
    FIREBASE_URL = "https://mauriciodallonder-64688-default-rtdb.firebaseio.com/history.json"

    @classmethod
    def get_history_data(cls):
        response = requests.get(cls.FIREBASE_URL)
        if response.ok:
            data = response.json()
            return data if isinstance(data, dict) else {}
        return {}

    @classmethod
    def add_new_item(cls, word, translation):
        data = cls.get_history_data()
        if word not in data:
            data[word] = translation
            cls.save_new_update(data)
            return True
        return False

    @classmethod
    def save_new_update(cls, data):
        requests.put(cls.FIREBASE_URL, json.dumps(data))

    @classmethod
    def delete_item(cls, word):
        data = cls.get_history_data()
        if word in data:
            del data[word]
            cls.save_new_update(data)
            return True
        return False

    @classmethod
    def delete_all(cls):
        cls.clear_all()
