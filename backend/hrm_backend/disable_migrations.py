"""
Module vide qui remplace les migrations de django.contrib.auth
et django.contrib.contenttypes.

Comme on utilise un backend dummy (pas de SQL), on ne veut pas
que Django tente de créer des tables pour ces apps.
"""


class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        return None


MIGRATION_MODULES = DisableMigrations()